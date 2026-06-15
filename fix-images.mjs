import fs from 'fs';
const target = 'src/components/PrincipalDashboard.tsx';
let content = fs.readFileSync(target, 'utf8');

const regex = /const reader = new FileReader\(\);\s+reader\.onload = \(ev\) => \{\s+if \(ev\.target\?\.result\) \{\s+(.+?)\s+\}\s+\};\s+reader.readAsDataURL\(file\);/gs;

content = content.replace(regex, (match, setterCode) => {
  const innerSetter = setterCode.replace(/ev\.target!?\.result as string/g, "url").replace(/ev\.target!?\.result/g, "url");
  
  return `resizeImage(file, 800, 800, 0.6).then((url) => {
                                ${innerSetter}
                              }).catch(e => console.error("Compression failed", e));`;
});

// Also replace the cases at 1783 where it's not file, but e.target.files[0]
fs.writeFileSync(target, content);
