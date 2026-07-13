/* Caleida — session password gate */
(function () {
  var KEY = 'caleida_unlocked';
  var HASH = 'ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae'; /* sha256 hex */
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
      '#caleida-gate .cg-mark{width:54px;height:54px;border-radius:50%;margin:0 auto;background:conic-gradient(#D9A23A 0 90deg,#C2552E 90deg 180deg,#1F8175 180deg 270deg,#E0825E 270deg 360deg);position:relative}' +
      '#caleida-gate .cg-mark:after{content:"";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:19px;height:19px;border-radius:50%;background:#F7F0E3}' +
      '#caleida-gate .cg-name{font-size:26px;font-weight:800;letter-spacing:.4px;color:#2A211B;margin-top:16px}' +
      '#caleida-gate .cg-sub{font-size:14px;color:#6B5D50;font-weight:500;margin-top:6px}' +
      '#caleida-gate form{margin-top:26px;display:flex;gap:9px}' +
      '#caleida-gate input{flex:1;min-width:0;padding:13px 16px;border-radius:13px;border:1.5px solid #E7DCC8;background:#FFFDF8;font-size:15px;color:#2A211B;outline:none;font-family:inherit}' +
      '#caleida-gate input:focus{border-color:#C2552E}' +
      '#caleida-gate button{background:#C2552E;color:#FFFDF8;border:none;padding:13px 20px;border-radius:13px;font-weight:700;font-size:15px;cursor:pointer;font-family:inherit}' +
      '#caleida-gate button:active{transform:translateY(1px)}' +
      '#caleida-gate .cg-err{font-size:13px;font-weight:600;color:#C2552E;margin-top:12px;min-height:18px;opacity:0;transition:opacity .15s}' +
      '#caleida-gate.cg-shake .cg-card{animation:cgshake .3s}' +
      '@keyframes cgshake{0%,100%{transform:translateX(0)}25%{transform:translateX(-7px)}75%{transform:translateX(7px)}}' +
      '</style>' +
      '<div class="cg-card">' +
      '<div class="cg-mark"></div>' +
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
