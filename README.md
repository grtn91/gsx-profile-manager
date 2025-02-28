# 🚀 GSX Profile Manager – Streamline Your Ground Handling Profiles!

GSX Profile Manager is now available in Version 1.0! This powerful tool makes managing and activating your GSX profiles easier than ever.

![Logo](https://github.com/grtn91/gsx-profile-manager/blob/master/public/gsxman.png)
![Screenshot](https://github.com/grtn91/gsx-profile-manager/blob/master/public/screen-2.png)

## ⚠️ Version 1.0.1 – First Stable Release!

🚧 This is the first stable version! 🚧

Core functionality is fully implemented.

Improved file selection view – The display of selected files has been optimized.

Enhanced logic – All existing files in the GSX Virtuali folder are kept, all symlinks are removed, and the new profile is applied.

Backup prompt – You’ll now be asked to back up your profiles before syncing to prevent data loss.

## 🔍 Key Features

✅ Folder Watching – Add a folder, and the app will automatically detect all GSX profiles (*.ini, *.py).

✅ Easy File Selection – Browse, select, and highlight profile files effortlessly.

✅ One-Click Activation – Instantly create symlinks to the Virtuali GSX Profile folder.

✅ Intuitive Folder Navigation – Expand, collapse, and organize your profiles with ease.

✅ Persistent User Sessions – Your settings are now saved across restarts.

## 🛠️ How to Use

Download the latest version.

Install the application.

Launch the tool and add your GSX profile storage location.

The app will automatically detect all GSX Profile folders and display available profile files.

Select a profile and click "Activate Profile" to create a symlink.

Done! 🎉 Your GSX profile is now active.

## ✅ Best Way to Use

GSX Profile Manager works best when used alongside MSFS Addon Linker:

Watch your scenery folder – Use the same folder you are watching in Addon Linker.

Organize GSX Profiles:

For each scenery, create a "GSX Profile" folder and place the profile files (*.ini, *.py) inside.

If a scenery was installed via an external installer or the MSFS Marketplace, manually create a folder with the airport’s name (e.g., marketplace-dev-eddl) and add a GSX Profile subfolder inside.

## 📂 Example Folder Structure

Sceneries/
│── Europe/
│   ├── Germany/
│   │   ├── eddl-dus-intl/
│   │   │   ├── GSX Profile/  ← Contains GSX profile files (`*.ini`, `*.py`)
│   │   ├── eddf-frankfurt/
│   │   │   ├── GSX Profile/  
│   ├── France/
│   │   ├── lfpg-charles-de-gaulle/
│   │   │   ├── GSX Profile/  
│── Asia/
│   ├── China/
│   │   ├── marketplace-dev-zbad/
│   │   │   ├── GSX Profile/  

## 🔧 Future Improvements

I’m actively working on new features for upcoming versions:

Expanded Profile Management:

Folder Scan – Scan a specified folder for GSX profiles.

Community Folder Detection – Automatically detect GSX profiles inside the MSFS Community folder.

Drag & Drop Support – Users can drag & drop profiles into the app for quick selection.

💖 Support the Project: I’m a solo developer working on this tool in my free time. If you’d like to support the project, any help is greatly appreciated! 🚀
