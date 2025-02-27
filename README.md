# 🚀 GSX Profile Manager – Streamline Your Ground Handling Profiles!  

**GSX Profile Manager** is a powerful tool designed for flight simulator enthusiasts who use **GSX** for ground handling. Managing and activating your GSX profiles has never been easier!  

## ⚠️ Warning: Early Alpha Version  

🚧 This is a **very early alpha version**, and there are known issues! 🚧  

- **IMPORTANT:** Activating a profile currently **flushes the entire GSX Virtuali folder**, instead of adding symlinks to existing files.  
- Use with caution and **back up your GSX profiles** before testing.  

![alt text](https://github.com/grtn91/gsx-profile-manager/blob/master/public/Screenshot.png "Screenshot of App")


## 🔍 Key Features  

- ✅ **Smart Profile Detection** – Simply add a folder to watch, and the app will automatically search for subfolders named **"GSX Profile"**, displaying all relevant files (`*.ini` & `*.py`).  
- ✅ **Easy File Selection** – Browse, select, and highlight profile files effortlessly.  
- ✅ **One-Click Activation** – Instantly activate your preferred GSX profile by creating a symlink to the Virtuali GSX Profile folder.  
- ✅ **Intuitive Folder Navigation** – Expand, collapse, and organize your profiles with ease.  

## 🛠️ How to Use  

1. **Download** the latest installer from the [Releases](https://github.com/grtn91/gsx-profile-manager/releases/tag/0.0.1-alpha-3) page.  
2. **Install** the application by running the installer.  
3. **Open the app** and add a folder to watch (your GSX profile storage location).  
4. The app will **automatically detect GSX Profile folders** and display available profile files.  
5. **Select a profile** and click **"Activate Profile"** to create a symlink to the Virtuali GSX Profile folder.  
6. Enjoy seamless GSX profile management!  

## ✅ Best Way to Use (Workaround)  

At the moment, the best way to use this tool is **in combination with [MSFS Addon Linker](https://flightsim.to/file/1572/msfs-addons-linker)**:  

1. **Watch your scenery folder** – Use the same scenery folder that you're watching in MSFS Addon Linker.  
2. **Organize GSX Profiles**:  
   - For each scenery, create a subfolder named **GSX Profile** and place the profile files (`*.ini`, `*.py`) inside it.  
   - If a scenery was installed via an **external installer** or the **MSFS Marketplace**, manually create a folder with the airport’s name (e.g., `marketplace-dev-eddl`).  
   - Inside that folder, add a **GSX Profile** subfolder and place the profile files inside it.  
3. This setup ensures that your GSX profiles remain organized and can be managed efficiently alongside your sceneries.  

## 📂 Example Folder Structure  

You can use **any folder structure**, but the **deepest folder must be named "GSX Profile"** and contain the GSX profile files.  

Example:  

```plaintext
Sceneries/
│── Europe/
│   ├── Germany/
│   │   ├── eddl-dus-intl/
│   │   │   ├── GSX Profile/   ← Contains GSX profile files (`*.ini`, `*.py`)
│   │   ├── eddf-frankfurt/
│   │   │   ├── GSX Profile/   ← Contains GSX profile files (`*.ini`, `*.py`)
│   ├── France/
│   │   ├── lfpg-charles-de-gaulle/
│   │   │   ├── GSX Profile/   ← Contains GSX profile files (`*.ini`, `*.py`)
│── Asia/
│   ├── China/
│   │   ├── marketplace-dev-zbad-frankfurt/
│   │   │   ├── GSX Profile/   ← Contains GSX profile files (`*.ini`, `*.py`)
```
This ensures that GSX Profile Manager can detect and manage your profiles properly!

Take control of your GSX profiles and optimize your ground handling experience today! ✈️

🔧 **Future Improvements**  

I'm actively working on improving GSX Profile Manager with the following enhancements:  

- 🛠️ **Fixing the Symlink Issue** – The current activation method flushes the GSX Virtuali folder. Future updates will ensure a safer approach that only adds the necessary symlinks.  
- 💾 **Persistent User Sessions** – Right now, the app does not save your selections. In the next release, your selected files and settings will be saved, so you don’t have to reselect everything after restarting.  
- 🔄 **Expanded Profile Management** – In a future release, we plan to introduce **three ways** to manage GSX profiles:  
  1. **Current method** – Scanning a specified folder for GSX profiles.  
  2. **Community Folder Scan** – Automatically detect GSX profiles inside the MSFS Community folder.  
  3. **Drag & Drop** – Users can drag & drop profiles into the app to store them for quick selection.  

Stay tuned for these improvements in upcoming releases! 🚀 

GSX Profile Manager is a tool I’ve developed to help simplify managing and activating GSX profiles in flight simulators. Future updates will improve symlink handling, add session persistence, and support Community folder scanning and drag & drop.

💖 [Support](https://www.paypal.com/donate/?hosted_button_id=TSPHNJJ58GEGN) the project: As a solo developer, any donations help me continue improving and updating this tool. Thank you for your support!
