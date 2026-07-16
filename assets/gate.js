/* Caleida — session password gate */
(function () {
  var KEY = 'caleida_unlocked';
  var HASH = '1b297d7ec9c6fe626899b69a5fae0179482d39453196d98bd97b8563fa117acb'; /* sha256 hex */
  try { if (sessionStorage.getItem(KEY) === HASH) return; } catch (e) { return; }

  var de = document.documentElement;
  de.style.visibility = 'hidden';

  function sha256hex(str) {
    var data = new TextEncoder().encode(str);
    return crypto.subtle.digest('SHA-256', data).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return ('0' + b.toString(16)).slice(-2);
      }).join('');
    });
  }

  function build() {
    var o = document.createElement('div');
    o.id = 'caleida-gate';
    o.innerHTML =
      '<style>' +
      '#caleida-gate{position:fixed;inset:0;z-index:2147483647;background:#F7F0E3;display:flex;align-items:center;justify-content:center;font-family:"Plus Jakarta Sans",-apple-system,BlinkMacSystemFont,sans-serif;visibility:visible}' +
      '#caleida-gate .cg-card{text-align:center;padding:40px 28px;max-width:360px;width:calc(100% - 48px)}' +
      '#caleida-gate .cg-mark{width:56px;height:56px;margin:0 auto;display:block}' +
      '#caleida-gate .cg-name{font-size:26px;font-weight:800;letter-spacing:.4px;color:#2A211B;margin-top:16px}' +
      '#caleida-gate .cg-sub{font-size:14px;color:#6B5D50;font-weight:500;margin-top:6px}' +
      '#caleida-gate form{margin-top:26px;display:flex;gap:9px}' +
      '#caleida-gate input{flex:1;min-width:0;padding:13px 16px;border-radius:13px;border:1.5px solid #E7DCC8;background:#FFFDF8;font-size:16px;color:#2A211B;outline:none;font-family:inherit}' +
      '#caleida-gate input:focus{border-color:#C05330}' +
      '#caleida-gate button{background:#C05330;color:#FFFDF8;border:none;padding:13px 20px;border-radius:13px;font-weight:700;font-size:16px;cursor:pointer;font-family:inherit}' +
      '#caleida-gate button:active{transform:translateY(1px)}' +
      '#caleida-gate .cg-err{font-size:13px;font-weight:600;color:#C05330;margin-top:12px;min-height:18px;opacity:0;transition:opacity .15s}' +
      '#caleida-gate.cg-shake .cg-card{animation:cgshake .3s}' +
      '@keyframes cgshake{0%,100%{transform:translateX(0)}25%{transform:translateX(-7px)}75%{transform:translateX(7px)}}' +
      '</style>' +
      '<div class="cg-card">' +
      '<div class="cg-mark"><svg width="56" height="56" viewBox="0 0 64 64" aria-hidden="true"><g transform="rotate(45 32 32)"><path d="M32 32 L32 2 A30 30 0 0 1 62 32 Z" fill="#D9A23A"/><path d="M32 32 L62 32 A30 30 0 0 1 32 62 Z" fill="#C05330"/><path d="M32 32 L32 62 A30 30 0 0 1 2 32 Z" fill="#1F8175"/><path d="M32 32 L2 32 A30 30 0 0 1 32 2 Z" fill="#E0825E"/></g><circle cx="32" cy="32" r="12" fill="#F7F0E3"/></svg></div>' +
      '<div class="cg-name">caleida</div>' +
      '<div class="cg-sub">This space is invite-only. Enter the password.</div>' +
      '<form><input type="password" autocomplete="current-password" placeholder="Password" aria-label="Password"><button type="submit">Enter</button></form>' +
      '<div class="cg-err">That&#8217;s not it, mate. Try again.</div>' +
      '</div>';
    document.body.appendChild(o);
    de.style.visibility = '';
    var input = o.querySelector('input');
    var err = o.querySelector('.cg-err');
    input.focus();
    o.querySelector('form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      sha256hex(input.value).then(function (h) {
        if (h === HASH) {
          try { sessionStorage.setItem(KEY, HASH); } catch (e) {}
          o.style.transition = 'opacity .25s';
          o.style.opacity = '0';
          setTimeout(function () { o.remove(); }, 260);
        } else {
          err.style.opacity = '1';
          o.classList.remove('cg-shake'); void o.offsetWidth; o.classList.add('cg-shake');
          input.select();
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else { build(); }
})();
