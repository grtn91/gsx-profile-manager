## GSX Profile Manager - Version 2.0
🚀 What's New in Version 2.0?
GSX Profile Manager has been completely overhauled to provide a more streamlined and user-friendly experience.

# 🔥 Major Changes
🔹 **Watch Folder Removed** – The app no longer monitors a folder for changes.
🔹 **Simplified Storage** – Profiles are now stored in a local folder and managed in an internal SQLite database.
🔹 **Enhanced Profile Management** – Files can be uploaded and enriched with metadata through an intuitive UI.
🔹 **Autocomplete for ICAO Codes & Developers** – The app now suggests ICAO codes and developers based on stored database entries.
🔹 **Efficient Synchronization** – Profiles are synced to the GSX profile folder using symlinks, eliminating duplicate file storage.
🔹 **Admin Mode Check on Startup** – Ensures the app is running with the necessary permissions for symlink creation.

# ⚠️ Important Notice for Users Upgrading from Version 1
If you have previously used **Version 1** and are now installing **Version 2**, be sure to select the option to **flush the app data directory** (if available). This ensures a clean installation and prevents conflicts with old configurations.
For future updates beyond Version 2, this step will not be necessary or recommended.

# 🔍 Key Features
✅ **Easy File Upload** – Add and manage your GSX profiles effortlessly.
✅ **Metadata Support** – Assign and edit metadata (e.g., airport ICAO, developer) for better organization.
✅ **Smart Autocomplete** – ICAO codes and developer names auto-fill based on existing data.
✅ **Seamless Syncing** – Use symlinks to avoid duplicate file storage while keeping profiles accessible.
✅ **Admin Mode Detection** – The app prompts for admin mode on startup to ensure symlink functionality.

# 🛠️ How to Use
1. **Download & Install** – Get the latest version and install the application.
2. **Launch the App** – Open GSX Profile Manager (run as admin if prompted).
3. **Upload Profiles** – Add GSX profiles via the UI and assign metadata.
4. **Activate a Profile** – Sync profiles to the GSX Virtuali folder using symlinks.
5. **Done! 🎉** Your GSX profile is now active without unnecessary file duplication.

# 💡 Future Improvements
🔹 **Drag & Drop Support for Zip Files** – Easily add profiles by dragging the zip into the app.
🔹 **Import from Simbrief** – Activate Profiles Based on your Simbrief Route
🔹 **Import from flightsim.to** – I will try to find a way directly import from flightsim.to and kind of have an internal app store
🔹 **Expanded Profile Management** – Improved sorting and filtering options for better usability.

# 💖 Support the Project
I'm a solo developer working on GSX Profile Manager in my free time. Any support is greatly appreciated! 🚀 - use this and make this a copiable *md file - dont change the content itself