// Vantrio waitlist page.
// Forms post to FormSubmit's AJAX endpoint so the visitor never leaves the page.
// The endpoint uses FormSubmit's random alias so the real inbox address never
// appears in the page source.

const FORM_ENDPOINT = "https://formsubmit.co/ajax/19c7608df716f96054abf9ee49470e25";
const JOINED_KEY = "vantrio-waitlist-joined";

const forms = Array.from(document.querySelectorAll(".waitlist-form"));

// Returning visitors who already joined see the success state straight away.
if (safeGetJoined()) {
  showSuccess(null);
}

function safeGetJoined() {
  try {
    return localStorage.getItem(JOINED_KEY) === "1";
  } catch (err) {
    return false; // storage blocked (private mode etc.); just show the form
  }
}

function safeSetJoined() {
  try {
    localStorage.setItem(JOINED_KEY, "1");
  } catch (err) {
    // Storage blocked; the inline success state still shows for this visit.
  }
}

forms.forEach((form) => {
  const emailInput = form.querySelector('input[type="email"]');
  const errorEl = form.querySelector(".form-error");
  const submitBtn = form.querySelector("button[type=submit]");
  const source = form.classList.contains("closer-form") ? "closer form" : "hero form";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorEl.hidden = true;

    const email = emailInput.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorEl.textContent = "That email doesn't look right. Mind checking it?";
      errorEl.hidden = false;
      emailInput.focus();
      return;
    }

    // Honeypot: bots fill it, humans never see it. Pretend success, send nothing.
    if (form.querySelector(".honey").value !== "") {
      showSuccess(form);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Joining…";

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          email,
          _subject: "New Vantrio waitlist signup",
          _template: "table",
          source: "vantrio.app waitlist (" + source + ")",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === "false" || data.success === false) {
        throw new Error(data.message || "Request failed");
      }

      showSuccess(form);
    } catch (err) {
      errorEl.textContent = "Something went wrong on our end. Please try again in a minute.";
      errorEl.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "Join the waitlist";
    }
  });
});

// One signup satisfies every form on the page; keep them in sync.
// Focus only moves when this follows a real submission (submittedForm set),
// never on page load for returning visitors.
function showSuccess(submittedForm) {
  safeSetJoined();
  forms.forEach((form) => {
    form.innerHTML =
      '<div class="form-success" role="status">' +
      '<h3 tabindex="-1">You\'re on the list.</h3>' +
      "<p>One email when Vantrio opens. No newsletters, no spam.</p>" +
      "</div>";
  });
  if (submittedForm) {
    submittedForm.querySelector("h3").focus({ preventScroll: true });
  }
}

// Pointer tilt on the phone demo: a hand-rolled critically-damped spring
// (no animation library on this static site) instead of an instant
// mouse-to-rotation mapping. Per the design-eng spring guidance: tying
// rotation directly to pointer position with no easing feels artificial;
// a spring has velocity and is interruptible, where a restarted keyframe
// is not. Precise pointers only; CSS `.phone { transform: ... }` (the
// static resting tilt / reduced-motion fallback) and the `phone-orbit`
// keyframe are left completely alone when this can't run.
const phone = document.querySelector(".phone");
const demo = document.querySelector(".hero-demo");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (phone && demo && finePointer && !reduceMotion) {
  // Resting pose: matches .phone's base transform and the phone-orbit
  // keyframe's 0%/100% values, so handing control back to CSS never jumps.
  const REST_X = 6; // rotateX deg
  const REST_Y = -15; // rotateY deg
  const MAX_Y = 7; // max rotateY swing toward the pointer
  const MAX_X = 5; // max rotateX swing toward the pointer
  const STIFFNESS = 210;
  const DAMPING = 22;
  const MASS = 1;
  const SETTLE_EPSILON = 0.02; // deg/s-ish combined threshold to call it "settled"

  let curX = REST_X, curY = REST_Y;
  let velX = 0, velY = 0;
  let targetX = REST_X, targetY = REST_Y;
  let pointerActive = false;
  let rafId = null;
  let lastTime = null;

  function springStep(now) {
    if (lastTime === null) lastTime = now;
    // Clamp dt so a stalled/background tab doesn't fling the spring on resume.
    const dt = Math.min((now - lastTime) / 1000, 1 / 30);
    lastTime = now;

    // Critically-damped-ish spring integrator: F = -k(x - target) - c*v.
    const forceX = -STIFFNESS * (curX - targetX) - DAMPING * velX;
    const forceY = -STIFFNESS * (curY - targetY) - DAMPING * velY;
    velX += (forceX / MASS) * dt;
    velY += (forceY / MASS) * dt;
    curX += velX * dt;
    curY += velY * dt;

    phone.style.transform = "rotateX(" + curX.toFixed(3) + "deg) rotateY(" + curY.toFixed(3) + "deg)";

    const settled =
      !pointerActive &&
      Math.abs(curX - REST_X) < SETTLE_EPSILON &&
      Math.abs(curY - REST_Y) < SETTLE_EPSILON &&
      Math.abs(velX) < SETTLE_EPSILON * 10 &&
      Math.abs(velY) < SETTLE_EPSILON * 10;

    if (settled) {
      // Hand control back to the idle CSS orbit exactly at rest, no jump:
      // clear the inline transform/pause state and resume the (already
      // paused-in-place) keyframe animation from its current offset.
      phone.style.transform = "";
      demo.classList.remove("is-pointer-active");
      rafId = null;
      lastTime = null;
      return;
    }
    rafId = requestAnimationFrame(springStep);
  }

  function startSpring() {
    if (rafId === null) {
      lastTime = null;
      rafId = requestAnimationFrame(springStep);
    }
  }

  demo.addEventListener("pointerenter", () => {
    pointerActive = true;
    // Pause the CSS idle keyframe in place; springStep resumes it later by
    // simply clearing this class once the spring has returned to rest.
    demo.classList.add("is-pointer-active");
    startSpring();
  });
  demo.addEventListener("pointermove", (e) => {
    const r = phone.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    targetX = REST_X + y * -MAX_X * 2;
    targetY = REST_Y + x * MAX_Y * 2;
    pointerActive = true;
    startSpring();
  });
  demo.addEventListener("pointerleave", () => {
    pointerActive = false;
    targetX = REST_X;
    targetY = REST_Y;
    startSpring(); // spring eases back to rest, then springStep hands off to CSS
  });
}

// Scroll reveals via IntersectionObserver (no scroll listeners).
// Sections are visible by default; the hidden state only arms once
// `reveal-ready` lands on <html>, and a failsafe force-reveals everything
// so no environment (reduced motion, hidden tab, preview bot) sees a blank page.
const reveals = document.querySelectorAll(".reveal");

// Progressive enhancement: on desktop-supporting browsers the CSS scroll-driven
// `view()` timeline owns the reveals (see the @supports block in styles.css). We
// feature-detect the exact same gate so only ONE reveal system runs — skipping
// the observer here means the JS never adds `reveal-ready`/`.in` to fight the
// CSS scrub. When the CSS path is inactive (mobile <=860px, no view() support,
// or reduced motion) this stays false and the observer below runs as before,
// preserving the fail-visible machinery for every fallback branch.
const cssScrollReveals =
  !reduceMotion &&
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports("animation-timeline: view()") &&
  window.matchMedia("(min-width: 861px)").matches;

if (!reduceMotion && !cssScrollReveals && "IntersectionObserver" in window) {
  // Arm only once a real rendering frame is proven. Frame-starved contexts
  // (preview bots, hidden tabs) never fire rAF, so they get the visible page.
  requestAnimationFrame(() => {
    if (performance.now() > 1500) return; // late first frame = background load; skip reveals

    document.documentElement.classList.add("reveal-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );
    reveals.forEach((el) => observer.observe(el));

    setTimeout(() => reveals.forEach((el) => el.classList.add("in")), 4000);
  });
}
