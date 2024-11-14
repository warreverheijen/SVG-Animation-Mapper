const readline = require("readline");
const fs = require("fs");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function removeDuplicates(frameIndex) {
  const uniqueFrameIndex = [...new Set(frameIndex)];
  return uniqueFrameIndex;
}

function Question(query, callback) {
  rl.question(query, (answer) => {
    callback(answer);
  });
}

function getInfo() {
  // Step 1: Ask for filename
  Question(
    "Please enter the filename containing the SVG content: ",
    (filename) => {
      svgFile.filename = filename;

      // Step 2: Ask for frame indices
      Question(
        "Please enter the frame indices in the format [1,2,3,4]: ",
        (frameIndexInput) => {
          svgFile.frameIndex = JSON.parse(frameIndexInput);
          svgFile.frameAmount = removeDuplicates(svgFile.frameIndex);

          // Step 3: Ask for frame duration
          Question(
            "Please enter the duration of each frame in seconds: ",
            (frameDuration) => {
              svgFile.frameDuration = parseFloat(frameDuration);

              // Step 4: Read the SVG file content
              fs.readFile(svgFile.filename, "utf8", (err, data) => {
                if (err) {
                  console.log("Error reading the file: " + err);
                  rl.close();
                  return;
                }

                svgFile.svgContent = data;

                const frameRegex = /<g[^>]*id="Frame_\d+[^"]*"/g;
                const frameMatches = svgFile.svgContent.match(frameRegex);
                svgFile.frameCount = svgFile.frameIndex.length;

                if (svgFile.frameCount === 0) {
                  console.log("No matching <g> elements found.");
                  rl.close();
                  return;
                }

                // After gathering all the info, we proceed with assigning keyframes and animations
                assignKeyframes();
                assignAnimations();

                // Step 5: Write the modified SVG content to a new file
                const outputFilename = "modified_" + svgFile.filename;
                fs.writeFile(outputFilename, svgFile.svgContent, (err) => {
                  if (err) {
                    console.log("Error writing the file: " + err);
                  } else {
                    console.log(
                      `File successfully written to ${outputFilename}`
                    );
                  }
                  rl.close();
                });
              });
            }
          );
        }
      );
    }
  );
}

function styleAppend(newStyleRule) {
  svgFile.svgContent = svgFile.svgContent.replace(
    /<\/style>/,
    `${newStyleRule}\n</style>`
  );
}

function assignAnimations() {
  for (let i = 1; i <= svgFile.frameCount; i++) {
    const styleRule = `#Frame_${i} { animation: frame${i} ${
      svgFile.frameDuration * svgFile.frameCount
    }s infinite; }`;
    styleAppend(styleRule);
  }
}

function assignKeyframes() {
  let interval = 100 / svgFile.frameCount;

  for (let frame = 1; frame < svgFile.frameAmount.length + 1; frame++) {
    let keyframes = `\n@keyframes frame${frame} {\n`;

    for (let i = 0; i < svgFile.frameCount; i++) {
      const intervalStart = interval * i;
      const intervalEnd = interval * i + interval - 0.1;

      if (svgFile.frameIndex[i] === frame) {
        keyframes += `  ${intervalStart}%, ${intervalEnd}% { display: block; }\n`;
      } else {
        keyframes += `  ${intervalStart}%, ${intervalEnd}% { display: none; }\n`;
      }
    }
    keyframes += `}\n`;

    styleAppend(keyframes);
  }
}

const svgFile = {}; // Initialize svgFile object

getInfo(); // Start the info gathering and processing flow
