let editViewer = null;
let DDV_DOC = null;

(async () => {
  // replace trial license key with your own key
  // reference: https://www.dynamsoft.com/document-viewer/docs/gettingstarted/helloworld.html
  Dynamsoft.DDV.Core.license = "Your trial license key"; // Public trial license which is valid for 24 hours
  Dynamsoft.DDV.Core.engineResourcePath = "https://cdn.jsdelivr.net/npm/dynamsoft-document-viewer@1.1.0/dist/engine"; // Lead to a folder containing the distributed WASM files
  await Dynamsoft.DDV.Core.loadWasm();
  await Dynamsoft.DDV.Core.init();
  // Configure image filter feature
  Dynamsoft.DDV.setProcessingHandler("imageFilter", new Dynamsoft.DDV.ImageFilter());
  // Create an edit viewer

  // customize load file button and replace with default one
  // reference: https://www.dynamsoft.com/document-viewer/docs/ui/customize/elements.html#event
  const CustomizeLoadButton = {
    type: Dynamsoft.DDV.Elements.Button,
    className: "ddv-load-image", // Set the button's icon
    tooltip: "Upload file", // Set tooltip for the button
    events: {
      click: "load", // Set the click event
    },
  };

  // get default uiConfig
  // reference: https://www.dynamsoft.com/document-viewer/docs/ui/default_ui.html
  const uiConfig = Dynamsoft.DDV.getDefaultUiConfig("editViewer");

  // check if media type is desktop or mobile
  if (uiConfig.className == "ddv-edit-viewer-desktop") {
    const header = uiConfig.children[0];
    header.children[0] = {
      type: Dynamsoft.DDV.Elements.Layout,
      // add or remove ui element
      // customize element
      children: [
        Dynamsoft.DDV.Elements.ThumbnailSwitch,
        Dynamsoft.DDV.Elements.Zoom,
        Dynamsoft.DDV.Elements.FitMode,
        Dynamsoft.DDV.Elements.DisplayMode,
        Dynamsoft.DDV.Elements.RotateLeft,
        // Dynamsoft.DDV.Elements.RotateRight,
        Dynamsoft.DDV.Elements.Crop,
        Dynamsoft.DDV.Elements.Filter,
        Dynamsoft.DDV.Elements.Undo,
        // Dynamsoft.DDV.Elements.Redo,
        Dynamsoft.DDV.Elements.DeleteCurrent,
        Dynamsoft.DDV.Elements.DeleteAll,
        Dynamsoft.DDV.Elements.Pan,
      ],
    };
    header.children[1] = {
      type: Dynamsoft.DDV.Elements.Layout,
      children: [
        {
          type: Dynamsoft.DDV.Elements.Pagination,
          className: "ddv-edit-viewer-pagination-desktop",
        },
        // Dynamsoft.DDV.Elements.Load,
        CustomizeLoadButton, // add customized button
        // Dynamsoft.DDV.Elements.Download,
        Dynamsoft.DDV.Elements.Print,
      ],
    };
  } else {
    uiConfig.children[0] = {
      type: Dynamsoft.DDV.Elements.Layout,
      className: "ddv-edit-viewer-header-mobile",
      // add or remove ui element
      children: [
        Dynamsoft.DDV.Elements.Blank,
        Dynamsoft.DDV.Elements.Pagination,
        // Dynamsoft.DDV.Elements.Download,
        CustomizeLoadButton,
      ], // add customized button
    };
    uiConfig.children[2] = {
      type: Dynamsoft.DDV.Elements.Layout,
      className: "ddv-edit-viewer-footer-mobile",
      // add or remove ui element
      children: [
        Dynamsoft.DDV.Elements.DisplayMode,
        Dynamsoft.DDV.Elements.RotateLeft,
        Dynamsoft.DDV.Elements.Crop,
        Dynamsoft.DDV.Elements.Filter,
        Dynamsoft.DDV.Elements.Undo,
        Dynamsoft.DDV.Elements.Delete,
        // Dynamsoft.DDV.Elements.Load,
      ],
    };
  }

  // create instance without customized element
  // let editViewer = new Dynamsoft.DDV.EditViewer({
  //   container: "container",
  // });

  // create editorViewer with customized elements
  editViewer = new Dynamsoft.DDV.EditViewer({
    container: "container",
    uiConfig,
  });

  // bind event to customized button
  editViewer.on("load", () => {
    let DDVFileInput = document.querySelector("input#DDVFileInput");
    DDVFileInput.click();
  });

  // create document
  // reference: https://www.dynamsoft.com/document-viewer/docs/features/datamanagement/docmanagement.html
  DDV_DOC = Dynamsoft.DDV.documentManager.createDocument({
    name: "DDV_DOC",
    author: "DDV",
  });

  // load created document
  editViewer.openDocument(DDV_DOC.uid);
})();

async function onDDVFilesUpload(e) {
  try {
    const files = e.target.files;
    const blobs = [];

    for (const file of files) {
      const blob = await readFileAsBlob(file);
      blobs.push(blob);
    }

    const password = document.querySelector("input[name=PDFPassword]").value;

    let sources = blobs.map((e) => {
      return { fileData: e, convertMode: "cm/auto", password };
    });

    await DDV_DOC.loadSource(sources);
    editViewer.openDocument(DDV_DOC.uid);
  } catch (e) {
    alert(e.message);
  }
  document.querySelector("#DDVFileInput").value = "";
}

// read file as blob
async function readFileAsBlob(file) {
  return new Promise((rs, rj) => {
    const reader = new FileReader();
    reader.onload = () => {
      rs(reader.result);
    };

    reader.onerror = () => {
      rj("Failed to read files");
    };

    reader.readAsArrayBuffer(file);
  })
    .then((res) => new Blob([res], { type: file.type }))
    .catch((msg) => alert(msg));
}

async function saveAsPDF() {
  // reference: https://www.dynamsoft.com/document-viewer/docs/api/interface/idocument/index.html#savetopdf
  try {
    const settings = {
      author: "Dynamsoft",
      compression: "pdf/jpeg",
      pageType: "page/a4",
      creator: "DDV",
      creationDate: "D:20230101085959",
      keyWords: "samplepdf",
      modifiedDate: "D:20230101090101",
      producer: "Dynamsoft Document Viewer",
      subject: "SamplePdf",
      title: "SamplePdf",
      version: "1.5",
      quality: 90,
    };
    const blob = await DDV_DOC.saveToPdf(settings);
    download(`${Date.now()}.pdf`, blob);
  } catch (e) {
    alert(e.message);
  }
}

async function saveAsPNG() {
  // reference: https://www.dynamsoft.com/document-viewer/docs/api/interface/idocument/index.html#savetopng
  try {
    const blobs = [];
    if (DDV_DOC.pages.length > 1) {
      for (let i = 0; i < DDV_DOC.pages.length; i++) {
        const result = await DDV_DOC.saveToPng(i);
        blobs.push(result);
      }
      const zip = await compressImages("png", blobs);
      download(`${Date.now()}.zip`, zip);
    } else if (DDV_DOC.pages.length == 1) {
      const blob = await DDV_DOC.saveToPng(0);
      if (blob) download(`${Date.now()}.png`, blob);
    }
  } catch (e) {
    alert(e.message);
  }
}

async function saveAsTIFF() {
  // reference: https://www.dynamsoft.com/document-viewer/docs/api/interface/idocument/index.html#savetotiff
  try {
    // Set custom tag
    const customTag1 = {
      id: 700,
      content: "Created By Dynamsoft",
      contentIsBase64: false,
    };

    // Set SaveTiffSettings
    const settings = {
      customTag: [customTag1],
      compression: "tiff/auto",
    };
    const blob = await DDV_DOC.saveToTiff(settings);
    download(`${Date.now()}.tiff`, blob);
  } catch (e) {
    alert(e.message);
  }
}

async function saveAsJPEG() {
  // reference: https://www.dynamsoft.com/document-viewer/docs/api/interface/idocument/index.html#savetojpeg
  try {
    const blobs = [];
    const settings = {
      quality: 80,
    };

    if (DDV_DOC.pages.length > 1) {
      for (let i = 0; i < DDV_DOC.pages.length; i++) {
        const result = await DDV_DOC.saveToJpeg(i, settings);
        blobs.push(result);
      }
      const zip = await compressImages("jpeg", blobs);
      if (zip) {
        download(`${Date.now()}.zip`, zip);
      }
    } else if (DDV_DOC.pages.length == 1) {
      const blob = await DDV_DOC.saveToJpeg(0, settings);
      if (blob) download(`${Date.now()}.jpeg`, blob);
    }
  } catch (e) {
    alert(e.message);
  }
}

// compress function
async function compressImages(fileExt, blobs) {
  let zip = new JSZip();

  let index = 1;
  for (let blob of blobs) {
    zip.file(`page-${index++}.${fileExt}`, blob);
  }

  return await zip
    .generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: {
        level: 9,
      },
    })
    .then(function (res) {
      return res;
    });
}

// download file
function download(fileName, blob) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;

  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

function upload() {
  document.querySelector("#DDVFileInput").click();
}
