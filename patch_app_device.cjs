const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the return statement
const returnTarget = "return (\\n    <>\\n      {deviceView === 'desktop' ? appContent : (\\n        <div className=\\\"min-h-screen bg-slate-200 dark:bg-slate-900 flex flex-col items-center py-4 md:py-8 justify-center overflow-hidden relative\\\">";
const returnReplacement = "return (\\n    <>\\n      {appContent}\\n      {/* Removed floating device toggle */}\\n    </>\\n  );\\n}\\n";

// Use a regex to replace everything from `return (` to the end of the file
code = code.replace(/return \(\s*<>[\s\S]*?\);\s*\}/, "return appContent;\n}");

fs.writeFileSync('src/App.tsx', code);
