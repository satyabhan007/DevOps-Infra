/* DevOps-Infra Learn — Part 3 · Chapter 10: Storage — CSI, StatefulSets & Persistent Data */
window.CH[10] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>A Pod is disposable — Kubernetes reschedules, restarts, and reshuffles it freely. That is fine for stateless apps, but a database cannot ' +
      'lose its data every time a pod is rescheduled. A <b>PersistentVolume</b> is storage that outlives any one pod; a <b>StatefulSet</b> gives each ' +
      'replica a stable identity AND its own dedicated volume that follows it across reschedules, instead of pods being fully interchangeable.</p>' +
      '<pre><code>Deployment + pod:    disposable, interchangeable, no stable identity or storage\n' +
      'StatefulSet + PVC:   pod-0 always gets volume-0 back, even after being deleted and recreated</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A hotel room vs. your own apartment.</b> A Deployment pod is a hotel room — any ' +
      'available room works, housekeeping resets it between guests, nothing about "room 214" matters to you. A StatefulSet pod is your apartment — you ' +
      'always come back to the SAME unit with YOUR furniture in it, even if the building briefly evacuates you (reschedules the pod) and lets you back in.</p></div>',
      try: [
        ['📖 Kubernetes — StatefulSets', 'https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/', 'o'],
        ['📖 Kubernetes — Persistent Volumes', 'https://kubernetes.io/docs/concepts/storage/persistent-volumes/', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code># a StatefulSet for a database — each replica gets its own PVC via volumeClaimTemplates\n' +
      'apiVersion: apps/v1\n' +
      'kind: StatefulSet\n' +
      'metadata: { name: postgres }\n' +
      'spec:\n' +
      '  serviceName: postgres\n' +
      '  replicas: 3\n' +
      '  volumeClaimTemplates:\n' +
      '  - metadata: { name: data }\n' +
      '    spec:\n' +
      '      accessModes: [ReadWriteOnce]\n' +
      '      storageClassName: fast-ssd\n' +
      '      resources: { requests: { storage: 100Gi } }\n\n' +
      '# choosing a storage class — the CSI driver does the real provisioning\n' +
      'apiVersion: storage.k8s.io/v1\n' +
      'kind: StorageClass\n' +
      'metadata: { name: fast-ssd }\n' +
      'provisioner: ebs.csi.aws.com    # or pd.csi.storage.gke.io, disk.csi.azure.com, etc.\n' +
      'volumeBindingMode: WaitForFirstConsumer   # delays provisioning until the pod is actually scheduled</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><b>CSI (Container Storage Interface)</b> is the standard plugin API every cloud ' +
      'and storage vendor implements — the cluster talks one common interface regardless of whether the backing disk is EBS, a Ceph cluster, or a NAS. ' +
      '<code>volumeBindingMode: WaitForFirstConsumer</code> is the standard setting to avoid provisioning a volume in the wrong availability zone before ' +
      'the scheduler has even picked a node.</p></div>',
      try: [
        ['📖 Kubernetes — Storage Classes', 'https://kubernetes.io/docs/concepts/storage/storage-classes/', 'o'],
        ['📖 Container Storage Interface (CSI) spec', 'https://kubernetes-csi.github.io/docs/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>A pod stuck Pending because of a zone mismatch.</b> ' +
      'A StatefulSet pod cannot schedule — "0/9 nodes available: node(s) had volume node affinity conflict" — because its PVC was provisioned in ' +
      'zone-a (early binding, before scheduling) while the scheduler wants to place the pod in zone-b for other reasons. Fix: ' +
      '<code>volumeBindingMode: WaitForFirstConsumer</code> on the StorageClass delays volume creation until AFTER a node is chosen, so the volume is ' +
      'always created in the right zone — this should be the default for any zonal block storage.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>Data "loss" that was actually a scale-down, not a bug.</b> ' +
      'A StatefulSet is scaled from 5 to 3 replicas, then back up to 5 — the two newest pods come up with EMPTY data, alarming the on-call. This is ' +
      'expected: StatefulSets do not delete PVCs on scale-down by default (data is preserved for exactly this reason) but scaling back UP creates ' +
      'brand-new PVCs for the new ordinal indices, not a resurrection of the old ones. Fix: understand this is by design — reattaching old volumes ' +
      'requires deliberate PVC naming/reuse, and a real backup/restore strategy (volume snapshots) is what actually protects against data loss.</p></div>' +
      '<p><b>A volume-snapshot backup strategy:</b> use <code>VolumeSnapshot</code>/<code>VolumeSnapshotClass</code> (CSI-native) on a schedule via a ' +
      'CronJob or a backup tool (Velero), tested with an actual restore drill — an untested backup is a belief, not a backup.</p>',
      try: [
        ['📖 Kubernetes — Volume Snapshots', 'https://kubernetes.io/docs/concepts/storage/volume-snapshots/', 'o'],
        ['📖 Velero — Kubernetes backup and restore', 'https://velero.io/docs/main/', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Immediate volume binding on zonal          Use WaitForFirstConsumer so the volume is provisioned in the\n' +
      '  block storage (default in some clouds)     SAME zone the scheduler actually places the pod.\n' +
      'Assuming StatefulSet scale-down/up           Scaling up after scaling down creates NEW PVCs for the new\n' +
      '  restores old pod data automatically         ordinals — old volumes are preserved but not auto-reattached.\n' +
      'No backup beyond "the cloud disk is           A snapshot of a corrupted or accidentally-deleted database\n' +
      '  durable" reasoning                           is still corrupted/deleted; durability != backup/recovery.\n' +
      'ReadWriteOnce PVCs assumed to support         RWO volumes can usually only attach to ONE node at a time —\n' +
      '  multi-pod access                             a rolling update needing the old+new pod both mounted at\n' +
      '                                                once can deadlock; check accessModes before assuming.\n' +
      'Running a stateful workload with no          Use PodDisruptionBudget and StatefulSet-specific\n' +
      '  disruption protection during node drains     considerations for node drains so quorum-sensitive apps\n' +
      '                                                (etcd, a DB cluster) do not lose majority during maintenance.\n' +
      'Never testing a restore from backup          A backup strategy without a tested restore drill is unverified\n' +
      '                                              — test it on a schedule, not only during a real incident.</code></pre>' +
      '<p><b>The real test:</b> delete a StatefulSet pod\'s underlying node entirely (simulate node loss). The pod should reschedule elsewhere and ' +
      'reattach its SAME PVC with data intact — if it comes back empty or stuck, either the CSI driver or the StorageClass\'s binding mode is misconfigured.</p>',
      try: [
        ['📖 Kubernetes — Node Affinity for Volumes', 'https://kubernetes.io/docs/concepts/storage/storage-classes/#volume-binding-mode', 'o'],
        ['☸️ Ch 14 — draining nodes for an upgrade needs the same disruption care', '#ch14', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>Expert-level storage design accepts that Kubernetes was built pod-first, storage-second — the abstractions (PVC binding, StatefulSet ' +
      'ordinals, CSI) work well, but genuinely stateful workloads (databases, message queues with disk-backed logs) still need domain-specific care: ' +
      'quorum/replica placement across failure domains, backup/restore tested against real RTO/RPO targets, and often a purpose-built operator ' +
      '(the Postgres Operator, the Kafka/Strimzi operator) layered on top of raw StatefulSets rather than hand-rolling reconciliation for something as ' +
      'delicate as leader election on a database.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Why does "volumeBindingMode: WaitForFirstConsumer" matter for zonal block storage?\n' +
      'A: Without it, the volume can be provisioned in a zone before the scheduler decides where the pod runs —\n' +
      '   if the scheduler then picks a node in a different zone, the pod cannot mount its own volume at all.\n' +
      '   Delaying binding until a node is chosen guarantees they match.\n\n' +
      'Q: A StatefulSet is scaled down then back up, and the new pods have empty data. Is this a bug?\n' +
      'A: No — scale-down preserves the old PVCs (by design, to protect against accidental data loss), but\n' +
      '   scaling back up creates NEW PVCs for the new ordinal indices rather than reattaching the old ones.\n' +
      '   Reattaching requires deliberate PVC reuse, not automatic StatefulSet behavior.\n\n' +
      'Q: Why is "the cloud disk is durable" not a substitute for a real backup strategy?\n' +
      'A: Durability protects against disk hardware failure, not against application-level corruption, an\n' +
      '   accidental deletion, or a bad migration — a snapshot/backup with a TESTED restore path is needed for\n' +
      '   those failure modes, which durability alone does not cover.\n\n' +
      'Q: What is a real risk of ReadWriteOnce PVCs during a rolling update?\n' +
      'A: An RWO volume typically attaches to only one node at a time. If a rolling update briefly needs both\n' +
      '   the old and new pod mounted (to hand off gracefully), it can deadlock waiting for a volume that is\n' +
      "   still attached elsewhere — StatefulSet update strategy needs to account for this.\n\n" +
      'Q: Why reach for a purpose-built operator (Postgres Operator, Strimzi) instead of a hand-rolled\n' +
      '   StatefulSet for a production database or message queue?\n' +
      'A: Because correct leader election, failover, backup scheduling, and safe rolling upgrades for quorum-\n' +
      "   sensitive stateful systems is genuinely hard reconciliation logic — a purpose-built operator encodes\n" +
      '   that domain expertise instead of every team re-deriving it from a bare StatefulSet.</code></pre>',
      try: [
        ['📖 CNCF — Data on Kubernetes community', 'https://dok.community/', 'o'],
        ['☸️ Ch 16 — storage decisions as a foundational layer in the reference architecture', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why should `volumeBindingMode: WaitForFirstConsumer` be used for zonal block storage classes?',
      opts: [
        'It makes provisioning faster',
        'It delays volume provisioning until after the scheduler picks a node, ensuring the volume is created in the same zone the pod will actually run in',
        'It disables zone awareness entirely',
        'It is required for ReadWriteMany volumes only'],
      ok: 1,
      why: 'Without it, a volume can be provisioned in a zone the scheduler later avoids, causing a stuck Pending pod due to a volume node affinity conflict.' },
    { q: 'A StatefulSet is scaled from 5 to 3 replicas, then back up to 5. What happens to the data for the two newly-added replicas?',
      opts: [
        'They automatically reattach the old volumes with all prior data intact',
        'They get brand-new PVCs for the new ordinal indices — the old volumes are preserved but not automatically reattached',
        'All data across the whole StatefulSet is deleted',
        'Scaling up is not possible after scaling down'],
      ok: 1,
      why: 'StatefulSets preserve PVCs on scale-down by design, but scaling back up creates new PVCs for the new ordinals rather than resurrecting the old ones automatically.' },
    { q: 'Why is "the cloud disk is durable" not sufficient as a full backup strategy for stateful workloads?',
      opts: [
        'Cloud disks are never actually durable',
        'Durability protects against hardware failure, not against application-level corruption or accidental deletion — a tested snapshot/restore process is needed for those',
        'Backups are unnecessary if using a StatefulSet',
        'Durability and backup are the same concept'],
      ok: 1,
      why: 'A durable disk still faithfully preserves corrupted or deleted data; real backup/restore protects against failure modes durability alone does not cover.' }
  ]
};
