# WordSearch
Word Search with nodejs streams

## Requirements
- Nodejs

## About
This project is a word search that uses nodejs streams to read a files and find a word in a matrix of letters. You need to pass the word to search, the path of the file and the output file.

## Usage
```
npm ci i
npm run build
node dist/index.js <value> <path> <outPutFile>

or

npm run dev
```

## Example
```
node dist/index.js --value='sollicitudin nibh sit' --path='./mock'
cat out.json

[
  {
    "word":"sollicitudin",
    "reports":[
      {
        "file":"./mock/test1.txt",
        "chunk":1,
        "word":"sollicitudin",
        "index":1488
      }
    ]
  }
]

```

