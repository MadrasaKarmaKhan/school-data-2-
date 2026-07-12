const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

const anchor = "const [showInstallModal, setShowInstallModal] = useState(false);";
const replace1 = `const [showInstallModal, setShowInstallModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };`;

code = code.replace(anchor, replace1);

const targetRegex = /\{\/\* Install App Modal \*\/\}[\s\S]*?<\/header>/;

const replacement = `{/* Install App Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 border-2 border-emerald-100 dark:border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in-95">
            <button 
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                <DownloadCloud className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">Get Our App</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Choose an option below to get the Madrasa Noorul Uloom portal on your device.
                </p>
              </div>

              <div className="grid gap-3 pt-2">
                {/* Option 1: QR Code */}
                <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5"><QrCode className="w-3.5 h-3.5" /> Scan QR Code</span>
                  <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200">
                    <img 
                      src={\`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=\${encodeURIComponent(window.location.href)}\`}
                      alt="App QR Code"
                      className="w-24 h-24 object-contain"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">Scan from any mobile device</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Option 2: Copy Link */}
                  <button 
                    onClick={handleCopyLink}
                    className="flex flex-col items-center justify-center p-3 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-750 rounded-xl transition-colors gap-2"
                  >
                    {copiedLink ? <Check className="w-5 h-5 text-emerald-500" /> : <Link2 className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>

                  {/* Option 3: Direct Download */}
                  <button 
                    onClick={() => {
                      if (deferredPrompt) {
                        deferredPrompt.prompt();
                      } else {
                        alert("To install the app directly, tap the browser menu (⋮) and select 'Add to Home Screen' or 'Install App'.");
                      }
                    }}
                    className="flex flex-col items-center justify-center p-3 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl transition-colors gap-2"
                  >
                    <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 text-center leading-tight">Direct<br/>Install</span>
                  </button>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}
    </header>`;

code = code.replace(targetRegex, replacement);

fs.writeFileSync('src/components/Header.tsx', code);
