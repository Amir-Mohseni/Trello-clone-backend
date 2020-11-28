const multer = require("multer");
const path = require("path");

const storageForUserPhoto = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./views/uploads/profile/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.originalname
        .replace(" ", "_")
        .replace(path.extname(file.originalname), "") +
        "-" +
        Date.now() +
        path.extname(file.originalname)
    );
  },
});

const storageForCardAttachment = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./views/uploads/card/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.originalname
        .replace(" ", "_")
        .replace(path.extname(file.originalname), "") +
        "-" +
        Date.now() +
        path.extname(file.originalname)
    );
  },
});

const uploadForUserPhoto = multer({
  storage: storageForUserPhoto,
  limits: { fileSize: 10000000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

const uploadForCardAttachment = multer({
  storage: storageForCardAttachment,
  limits: { fileSize: 10000000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// Check File Type
function checkFileType(file, cb) {
  try {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif/;
    // Check ext
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      throw new Error("Only image Files with size less than 10MB.");
    }
  } catch (err) {
    console.log(err.message);
    return cb(null, true);
  }
}

module.exports = {
  uploadForUserPhoto,
  uploadForCardAttachment,
};
