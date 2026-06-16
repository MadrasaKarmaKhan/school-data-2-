import fs from 'fs';

let content = fs.readFileSync('src/components/PrincipalDashboard.tsx', 'utf8');

const fieldsToAddUrlInput = [
  { id: 'heroBg1', name: 'Hero Slider Image 1' },
  { id: 'heroBg2', name: 'Hero Slider Image 2' },
  { id: 'heroBg3', name: 'Hero Slider Image 3' },
  { id: 'fac1Img', name: 'Facility Banner Image' },
  { id: 'fac2Img', name: 'Facility Banner Image' },
  { id: 'fac3Img', name: 'Facility Banner Image' },
];

for (const field of fieldsToAddUrlInput) {
  // Find where the block for this field ends, usually after the "Remove" button
  // and insert the text input there.
  
  const removeBtnRegex = new RegExp(`onClick=\\{\\(\\) => setSchoolConfig\\(\\{ \\.\\.\\.schoolConfig, ${field.id}: "" \\}\\)\\}[^>]*>\\s*Remove\\s*<\\/button>\\s*\\)\\}\\s*<\\/div>`, 's');
  
  content = content.replace(removeBtnRegex, (match) => {
    return `${match}
  <input
    type="text"
    placeholder="Or paste image URL (या डायरेक्ट लिंक डालें)"
    value={schoolConfig.${field.id} || ""}
    onChange={(e) => setSchoolConfig({ ...schoolConfig, ${field.id}: e.target.value })}
    className="w-full mt-2 p-2 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900 text-xs font-mono"
  />`;
  });
}

const principalPhotoRegex = /onClick=\{\(\) => setSchoolConfig\(\{ \.\.\.schoolConfig, principalPhotoUrl: "" \}\)\}[^>]*>\s*REMOVE\s*<\/button>\s*\)\}\s*<\/div>/s;
content = content.replace(principalPhotoRegex, (match) => {
  return `${match}
  <input
    type="text"
    placeholder="Or paste image URL (या डायरेक्ट लिंक डालें)"
    value={schoolConfig.principalPhotoUrl || ""}
    onChange={(e) => setSchoolConfig({ ...schoolConfig, principalPhotoUrl: e.target.value })}
    className="w-full mt-2 p-2 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900 text-xs font-mono"
  />`;
});

fs.writeFileSync('src/components/PrincipalDashboard.tsx', content);
