const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const startTag = '        {/* Connection Check */}\n        <AnimatePresence mode="wait">\n          {showHomeOverlay ? (';
const index = code.indexOf(startTag);
if (index === -1) throw new Error('Start not found');

const endTag = "      ) : (\n        <motion.div\n          key={`app-${address || 'disconnected'}`}\n";
const endIndex = code.indexOf(endTag, index);
if (endIndex === -1) throw new Error('End not found');

const newCode = code.slice(0, index) + 
  '        {/* Connection Check */}\n        <AnimatePresence mode="wait">\n          <Routes location={location} key={location.pathname}>\n            <Route path="/" element={<Home />} />\n            <Route path="/dashboard/*" element={\n              <motion.div\n                key={`app-${address || \'disconnected\'}`}\n' +
  code.slice(endIndex + endTag.length);

fs.writeFileSync('src/App.tsx', newCode);
console.log('Modified src/App.tsx successfully');
