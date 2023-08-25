# Local development 

### Dependencies
Install required dependencies with yarn install
for backend
```
mangum==0.9.2
pydantic==1.6.2
requests==2.25.1
fastapi==0.68.1
uvicorn==0.13.4
```

## Package an extension
```
Bring up the Extensions management page by going to this URL: chrome://extensions
If Developer mode has a + by it, click the +.
Click the Pack extension button. A dialog appears.
In the Extension root directory field, specify the path to the extension's folder 
```

## Run
To start the application: -for frontend
```shell
cd extension
npm run watch

```

To start the application: -for backend
```
click run and debug button from vscode toolbar
launch.json file is created with corresponding cwd setup
run with "Python: FastAPI"
```

## Tests
To run all tests use:
`npm test` 