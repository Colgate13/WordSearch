import fs from "fs";
import { pipeline } from 'node:stream/promises';

let pathToSearch = "";
let outPutFile = "./out.json";
let valueSearch = "";

process.argv.forEach((val, index) => {
  if (val.startsWith('--value=')) {
    valueSearch = val.substring(8).replace(/^"(.*)"$/, '$1');
  }

  if (val.startsWith("--path=")) { 
    pathToSearch = val.slice(7).trim();
  }

  if (val.startsWith('--output=')) {
    outPutFile = val.substring(10).replace(/^"(.*)"$/, '$1');
  }
});

if (!pathToSearch) {
  console.log("Path is required");
  console.log(`use: node dist/index.js <value> <path> <outPutFile>`);
  process.exit(1);
}

if (!valueSearch) {
  console.log("Value is required");
  console.log(`use: node dist/index.js <value> <path> <outPutFile>`);
  process.exit(1);
}

let generalReports = {
  totalFiles: 0,
  totalChunks: 0,
  totalMatches: 0,
  totalWords: 0,
  totalBytes: 0,
  totalLines: 0
}

interface IReport {
  file: string | Buffer;
  chunk: number;
  word: string;
  index: number;
}

interface IReportBeautify {
  word: string;
  reports: IReport[];
}

async function prepareValue(value: string): Promise<string[]> {
  valueSearch = valueSearch.toLocaleLowerCase();
  return value.toLowerCase().trim().split(" ")
}

async function run() {
  await pipeline(
    ReadableStreamGetFiles,
    transformStreamSearch,
    transformStreamPrepareReport,
    writebleSreamOutput
  );
  
  const geral = `🟢Finished!

  Output File: ${outPutFile}
  
  Found: ${generalReports.totalMatches} matches
  In: ${generalReports.totalFiles} files
  Total Bytes researcher: ${generalReports.totalBytes}
  Words: ${generalReports.totalWords}
  Lines: ${generalReports.totalLines}\n`

  console.log(geral);
}

async function* ReadableStreamGetFiles(): AsyncIterable<fs.ReadStream> { 
  const path = pathToSearch;
  for (const file of await fs.promises.readdir(path)) {
    const fullPath = `${path}/${file}`;
    yield fs.createReadStream(fullPath);
  }
}

async function* transformStreamSearch(stream: AsyncIterable<fs.ReadStream>): AsyncIterable<IReport> {
  const searchArray = await prepareValue(valueSearch);
  console.log("Searching: ", searchArray)
  for await (const data of stream) {
    data.setEncoding('utf8');
    let chunkCount = 0;
    for await (const chunk of data) {
      chunkCount++;
      chunk.toLocaleLowerCase();

      for (let i = 0; i < searchArray.length; i++) { 
        const element = searchArray[i];
        if (chunk.includes(element)) {
          const match = chunk.match(element);
          if (match) { 
            const report: IReport = {
              file: data.path,
              chunk: chunkCount,
              word: element,
              index: match.index
            }
            generalReports.totalMatches++;
            generalReports.totalWords++;
            generalReports.totalBytes += match[0].length;
            generalReports.totalLines++;
            
            yield report;
          }
        }
      }
    }
  }
}

async function* transformStreamPrepareReport(reportStream: AsyncIterable<IReport>): AsyncIterable<IReportBeautify[]> { 

  const report: IReportBeautify[] = []

  for await (const reportRaw of reportStream) {
    const reportFind = report.find((item) => item.word === reportRaw.word);
    if (reportFind) { 
      reportFind.reports.push(reportRaw);
    } else { 
      report.push({
        word: reportRaw.word,
        reports: [reportRaw]
      })
    }
  }

  yield report;
}

async function* writebleSreamOutput(reportStream: AsyncIterable<IReportBeautify[]>): any { 

  if (fs.existsSync(outPutFile)) { 
    fs.renameSync(outPutFile, `${outPutFile}-${Date.now()}-old.json`);
  }

  for await (const report of reportStream) {
    const reportString = JSON.stringify(report);
    yield fs.createWriteStream(outPutFile, { flags: 'a' }).write(reportString);
  }
}

run();