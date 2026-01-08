(() => {
  "use strict";
  const TAG = "[NoCopy]";
  console.log(TAG, "running on", location.href);

  // --- alert throttle ---
  let lastAlert = 0;
  function notify() {
    const now = Date.now();
    if (now - lastAlert > 1500) {
      lastAlert = now;
      window.alert("Copy and paste is disabled on this site.");
    }
  }

  // --- generic blocker ---
  const blockEvt = (e) => {
    try { e.clipboardData?.setData("text/plain", ""); } catch {}
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation?.();
    notify();
    return false;
  };

  // 1) Native clipboard events
  document.addEventListener("copy", blockEvt, true);
  document.addEventListener("cut", blockEvt, true);
  document.addEventListener("paste", blockEvt, true);

  // 2) Hotkeys
  document.addEventListener("keydown", (e) => {
    const k = (e.key || "").toLowerCase();
    const mod = e.ctrlKey || e.metaKey;
    if (mod && (k === "c" || k === "v" || k === "x")) blockEvt(e);
  }, true);

  // 3) Patch Clipboard API (Copy buttons often use this)
  if (navigator.clipboard?.writeText) {
    const orig = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = async () => {
      console.log(TAG, "blocked clipboard.writeText");
      notify();
      return Promise.resolve(); // pretend success
    };
    navigator.clipboard.__origWriteText = orig;
  }

  // 4) Disable "Copy code" button (ChatGPT UI)
  const isCopyButton = (el) => {
    if (!el) return false;
    const txt = (el.innerText || el.textContent || "").trim().toLowerCase();
    const aria = (el.getAttribute?.("aria-label") || "").trim().toLowerCase();
    return txt === "copy code" || aria === "copy code";
  };

  const disable = (btn) => {
    if (btn.dataset.nocopyDone) return;
    btn.dataset.nocopyDone = "1";

    btn.addEventListener("click", (e) => {
      console.log(TAG, "blocked Copy code button");
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      notify();
      return false;
    }, true);

    // visual hint
    btn.style.opacity = "0.4";
    btn.title = "Copy disabled";
  };

  const scan = () => {
    document.querySelectorAll("button,[role='button']").forEach((el) => {
      if (isCopyButton(el)) disable(el);
    });
  };

  scan();
  const mo = new MutationObserver(scan);
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
