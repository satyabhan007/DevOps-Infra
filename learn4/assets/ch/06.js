/* DevOps-Infra Learn — Part 4 · Chapter 6: Zero-Trust Networking */
window.CH[6] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>The old model was <b>"trusted inside, untrusted outside"</b> — once you were on the corporate VPN or inside the VPC, you were mostly ' +
      'trusted by default. <b>Zero trust</b> throws that out: no request is trusted just because of where it came from. Every request is ' +
      'authenticated and authorized, every time, regardless of network location.</p>' +
      '<pre><code>OLD MODEL   internet [firewall] --- trusted flat internal network --- everything can reach everything\n' +
      'ZERO TRUST  every single request, inside or outside, proves WHO it is and gets checked against policy</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A building where every door needs a badge, not just the front entrance.</b> ' +
      'The old model was a building with one guarded front door — anyone past the lobby could open any office. Zero trust badges every single door, ' +
      'including ones between two offices on the same floor, so being physically inside the building proves nothing about which rooms you should be ' +
      'allowed into.</p></div>',
      try: [
        ['📖 NIST SP 800-207 — Zero Trust Architecture', 'https://csrc.nist.gov/pubs/sp/800/207/final', 'o'],
        ['📖 Google — BeyondCorp overview', 'https://cloud.google.com/beyondcorp', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code>THE THREE THINGS ZERO TRUST CHECKS ON EVERY REQUEST\n' +
      '  1. Identity      who/what is making this call? (a user via SSO, a service via mTLS cert/token)\n' +
      '  2. Device/context  is the calling device/workload in an acceptable state? (patched, in the right cluster)\n' +
      '  3. Policy         does THIS identity get to do THIS action on THIS resource, right now?\n\n' +
      'SERVICE-TO-SERVICE: mTLS-authenticated calls, e.g. via a service mesh (Istio) PeerAuthentication\n' +
      '  apiVersion: security.istio.io/v1\n' +
      '  kind: PeerAuthentication\n' +
      '  metadata: { name: default, namespace: payments }\n' +
      '  spec: { mtls: { mode: STRICT } }   # every call into this namespace MUST present a valid mTLS cert\n\n' +
      'USER-TO-APP: an identity-aware proxy in front of every internal app checks SSO identity + device posture\n' +
      '  BEFORE the request ever reaches the app — the app itself never has to trust the network it sits on.</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><a href="https://csrc.nist.gov/pubs/sp/800/207/final" target="_blank" rel="noopener">' +
      'NIST SP 800-207</a> is the reference architecture the industry cites; Google\'s ' +
      '<a href="https://cloud.google.com/beyondcorp" target="_blank" rel="noopener">BeyondCorp</a> model (identity-aware proxy, no VPN) and a service ' +
      'mesh like <a href="https://istio.io/latest/docs/concepts/security/" target="_blank" rel="noopener">Istio</a> with mTLS are the standard ' +
      'implementations for user-facing and service-to-service traffic respectively.</p></div>',
      try: [
        ['📖 Istio — security concepts (mTLS)', 'https://istio.io/latest/docs/concepts/security/', 'o'],
        ['🔗 Ch 8 — certificates &amp; mTLS mechanics', '#ch8', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The flat network that turned one phished laptop into a full breach.</b> ' +
      'An employee\'s laptop is phished while connected to the corporate VPN. Because "inside the VPN" was treated as trusted, the attacker\'s foothold ' +
      'can reach internal admin panels, file shares, and databases with no additional authentication — the VPN itself was the only gate, and it was ' +
      'already past. A zero-trust redesign (identity-aware proxy per app, device posture checks, per-app authorization) would have required the ' +
      'attacker to re-authenticate and pass a device check at EVERY internal app, not just the VPN once.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The service mesh rollout that broke silently.</b> ' +
      'A team enables strict mTLS across a namespace during a migration, but one legacy service still calls in via plain HTTP because its sidecar ' +
      'proxy was never injected. Instead of a loud failure, PERMISSIVE mode (accepts both mTLS and plaintext, left on by default during migration) ' +
      'silently let the insecure calls through for months, defeating the point of the rollout without anyone noticing until an audit flagged it. ' +
      'Fix: track sidecar injection coverage as an explicit metric, and flip to STRICT mode with an alert on any plaintext connection attempt.</p></div>' +
      '<p><b>Rule of thumb:</b> "we\'re on the VPN/inside the VPC" is a network fact, not a security decision — zero trust means every authorization ' +
      'decision is made independent of that fact.</p>',
      try: [
        ['📖 Istio — mTLS migration (permissive vs strict)', 'https://istio.io/latest/docs/tasks/security/authentication/mtls-migration/', 'o'],
        ['🔗 Ch 12 — bastion/VPN vs identity-aware access', '#ch12', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                               FIX\n' +
      '"Inside the VPC/VPN" treated as trusted      Authenticate and authorize every request independent of\n' +
      '                                            network location — an identity-aware proxy per app.\n' +
      'A flat internal network, no segmentation      Microsegment by service/namespace; a compromised service\n' +
      '                                            should not be able to reach unrelated services by default.\n' +
      'mTLS left in PERMISSIVE mode indefinitely     Track sidecar/cert coverage explicitly and flip to STRICT\n' +
      '                                            with alerting on any plaintext fallback.\n' +
      'One-time login trusted for the whole session  Continuously (re-)evaluate device posture/context, not just\n' +
      '                                            at initial authentication — a device can go from healthy to\n' +
      '                                            compromised mid-session.\n' +
      'VPN as the ONLY access control for internal   Layer an identity-aware proxy/per-app authorization behind\n' +
      '  tools                                       the VPN — the VPN should not be the last line of defense.</code></pre>' +
      '<p><b>The real test:</b> simulate one compromised internal workload/laptop and ask what it can reach. In a true zero-trust setup the answer ' +
      'is "almost nothing beyond what that specific identity was explicitly granted" — not "everything on the same network."</p>',
      try: [
        ['📖 NIST SP 800-207 — full text', 'https://csrc.nist.gov/pubs/sp/800/207/final', 'o'],
        ['🔗 Ch 9 — network security groups as one layer, not the only layer', '#ch9', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, zero trust is a <b>migration strategy</b>, not a switch you flip — you cannot authenticate every request on day one ' +
      'across a legacy estate. The real work is sequencing: identity-aware proxies for user traffic first (highest ROI, least app-code change), ' +
      'then mTLS rollout service by service in permissive-then-strict phases, with explicit coverage metrics the whole way so "zero trust" doesn\'t ' +
      'quietly become "zero trust for the services we got to."</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What does zero trust actually change compared to a traditional perimeter/VPN model?\n' +
      'A: It removes network location as a factor in trust decisions. Every request — inside or outside the\n' +
      '   traditional perimeter — must independently authenticate and be authorized against policy, so a\n' +
      '   compromised foothold anywhere on the network gains nothing by virtue of network position alone.\n\n' +
      'Q: How would you roll out zero trust across a large legacy estate without breaking everything at once?\n' +
      'A: Phase it: identity-aware proxy in front of user-facing internal apps first (biggest blast-radius\n' +
      '   reduction, least app change), then service mesh mTLS namespace by namespace in PERMISSIVE mode while\n' +
      '   tracking sidecar coverage, flipping each namespace to STRICT once coverage is verified complete.\n\n' +
      'Q: Why is PERMISSIVE mTLS mode dangerous if left on indefinitely?\n' +
      'A: It silently accepts both authenticated mTLS and unauthenticated plaintext connections, so a\n' +
      '   misconfigured service that never got its sidecar keeps working over plaintext with no alert — the\n' +
      '   security gain of mTLS is defeated without anyone noticing until it\'s audited.\n\n' +
      'Q: How does zero trust change how you think about a stolen employee laptop?\n' +
      'A: In a perimeter model, the laptop being on the VPN grants broad internal reach. In zero trust, the\n' +
      '   laptop\'s identity and device posture are re-evaluated per app/request, so a stolen but still-\n' +
      '   authenticated session is limited to exactly what THAT identity was authorized for — not the network.\n\n' +
      'Q: What metric proves a zero-trust rollout is actually complete, not just started?\n' +
      'A: Coverage — the percentage of services/traffic actually enforcing STRICT mTLS or passing through the\n' +
      '   identity-aware proxy, with alerting on any plaintext/unauthenticated fallback — not the existence of\n' +
      '   the mesh or proxy itself, which can coexist with large unprotected gaps.</code></pre>',
      try: [
        ['📖 Google — BeyondCorp research papers', 'https://cloud.google.com/beyondcorp#researchPapers', 'o'],
        ['🔗 Ch 11 — identity federation underneath zero trust', '#ch11', 'o']
      ] }
  ],

  quiz: [
    { q: 'What is the core change zero-trust networking makes compared to a traditional perimeter/VPN model?',
      opts: [
        'It removes the need for authentication entirely',
        'It removes network location as a factor in trust — every request, inside or outside the traditional perimeter, must independently authenticate and be authorized',
        'It only applies to external traffic',
        'It replaces IAM policies with firewall rules'],
      ok: 1,
      why: 'Zero trust\'s defining shift is that being "inside the network" no longer implies any level of trust — every request proves identity and is checked against policy.' },
    { q: 'Why is leaving a service mesh in PERMISSIVE mTLS mode indefinitely a risk?',
      opts: [
        'It slows down all traffic significantly',
        'It silently accepts both authenticated mTLS and unauthenticated plaintext connections, so a misconfigured or un-injected service keeps working insecurely without any alert',
        'It is not supported in production',
        'It disables health checks'],
      ok: 1,
      why: 'PERMISSIVE mode exists for migration, accepting both connection types — left on too long, it hides exactly the gaps a zero-trust rollout is meant to close.' },
    { q: 'In a zero-trust model, what happens to an authenticated but stolen employee laptop\'s session?',
      opts: [
        'It gains full internal network access because it already authenticated once',
        'Its identity and device posture are (re-)evaluated per app/request, limiting reach to exactly what that identity is authorized for, not broad network access',
        'It is automatically blocked by the VPN',
        'Nothing changes versus a perimeter model'],
      ok: 1,
      why: 'Continuous, per-request evaluation of identity and context means the session is bounded by explicit authorization, not by having once passed a perimeter check.' }
  ]
};
