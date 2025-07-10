const fs = require('fs');
const path = require('path');

// Lấy danh sách tất cả file tsx trong thư mục screens
const screensDir = './screens';
const files = fs.readdirSync(screensDir).filter(file => file.endsWith('.tsx'));

files.forEach(file => {
  const filePath = path.join(screensDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Bỏ qua các file đã có font Roboto
  if (content.includes("fontFamily: 'Roboto'")) {
    console.log(`${file} - Already has Roboto font`);
    return;
  }
  
  // Tìm và thêm fontFamily cho các text style
  const stylePatterns = [
    // Pattern cho các style có fontSize
    /(\s+)(\w+):\s*\{\s*\n((?:\s+\w+:\s*[^,}]+,?\s*\n)*\s+fontSize:\s*[^,}]+,?\s*\n(?:\s+\w+:\s*[^,}]+,?\s*\n)*)\s*\}/g,
    // Pattern cho các style khác có text properties
    /(\s+)(\w+):\s*\{\s*\n((?:\s+\w+:\s*[^,}]+,?\s*\n)*\s+(?:fontWeight|color|textAlign):\s*[^,}]+,?\s*\n(?:\s+\w+:\s*[^,}]+,?\s*\n)*)\s*\}/g
  ];
  
  let modified = false;
  
  stylePatterns.forEach(pattern => {
    content = content.replace(pattern, (match, indent, styleName, styleContent) => {
      // Kiểm tra nếu đã có fontFamily hoặc không phải text style
      if (styleContent.includes('fontFamily') || 
          !styleContent.match(/fontSize|fontWeight|color.*['"]#|textAlign/)) {
        return match;
      }
      
      // Thêm fontFamily: 'Roboto'
      const lines = styleContent.split('\n');
      let insertIndex = -1;
      
      // Tìm vị trí thích hợp để chèn fontFamily
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim() && !lines[i].trim().startsWith('}')) {
          insertIndex = i;
          break;
        }
      }
      
      if (insertIndex !== -1) {
        const currentLine = lines[insertIndex];
        const hasComma = currentLine.trim().endsWith(',');
        
        if (!hasComma) {
          lines[insertIndex] = currentLine + ',';
        }
        
        const indentMatch = currentLine.match(/^(\s+)/);
        const lineIndent = indentMatch ? indentMatch[1] : '    ';
        lines.splice(insertIndex + 1, 0, `${lineIndent}fontFamily: 'Roboto',`);
        
        modified = true;
        return `${indent}${styleName}: {\n${lines.join('\n')}\n${indent}}`;
      }
      
      return match;
    });
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`${file} - Added Roboto font`);
  } else {
    console.log(`${file} - No changes needed`);
  }
});

console.log('Script completed!'); 