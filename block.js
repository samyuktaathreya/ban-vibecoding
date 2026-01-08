(() => {
  "use strict";
  const TAG = "[NoCopy]";
  console.log(TAG, "running on", location.href);

  // 1) Block keyboard + native copy/cut/paste events
  const blockEvt = (e) => {
    try { e.clipboardData?.setData("text/plain", ""); } catch {}
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation?.();
    return false;
  };

  document.addEventListener("copy", blockEvt, true);
  document.addEventListener("cut", blockEvt, true);
  document.addEventListener("paste", blockEvt, true);

  document.addEventListener("keydown", (e) => {
    const k = (e.key || "").toLowerCase();
    const mod = e.ctrlKey || e.metaKey;
    if (mod && (k === "c" || k === "v" || k === "x")) blockEvt(e);
  }, true);

  // 2) Patch Clipboard API (what "Copy code" buttons use)
  if (navigator.clipboard?.writeText) {
    const orig = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = async (text) => {
      console.log(TAG, "blocked clipboard.writeText");
      // Pretend success, but write nothing
      return Promise.resolve();
    };
    // (keep orig if you want a toggle later)
    navigator.clipboard.__origWriteText = orig;
  }

  // 3) Specifically neutralize the "Copy code" button clicks on ChatGPT
  // ChatGPT is a SPA, so watch for new buttons appearing.
  const isCopyButton = (el) => {
    if (!el) return false;
    const txt = (el.innerText || el.textContent || "").trim().toLowerCase();
    const aria = (el.getAttribute?.("aria-label") || "").trim().toLowerCase();
    return txt === "copy code" || aria === "copy code";
  };

  const disable = (btn) => {
    if (btn.dataset.nocopyDone) return;
    btn.dataset.nocopyDone = "1";

    // Prevent click from reaching their handler
    btn.addEventListener("click", (e) => {
      console.log(TAG, "blocked Copy code button");
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      return false;
    }, true);

    // Optional: visually indicate disabled
    btn.style.opacity = "0.4";
    btn.style.pointerEvents = "auto"; // keep events so our blocker catches clicks
    btn.title = "Copy blocked by NoCopy extension";
  };

  const scan = () => {
    // Scan buttons/role=button elements
    document.querySelectorAll("button,[role='button']").forEach((el) => {
      if (isCopyButton(el)) disable(el);
    });
  };

  scan();
  const mo = new MutationObserver(scan);
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
