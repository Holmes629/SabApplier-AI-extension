//   /* global chrome */


//   // const API_BASE_URL = 'http://127.0.0.1:8000/api'
//   const API_BASE_URL = 'https://api.sabapplier.com/api';

// export const getAuthToken = async (token, onStatusUpdate) => {
//   const getPageHTML = () => {
//     return document.documentElement.outerHTML;
//   };

//   try {
//     if (!token || token === "") {
//       onStatusUpdate("Unable to fetch Account details", "error");
//       throw new Error("Please login to your account");
//     }

//     // Get current active tab
//     const [tab] = await chrome.tabs.query({
//       active: true,
//       currentWindow: true,
//     });

//     // Get HTML content of current tab
//     const result = await chrome.scripting.executeScript({
//       target: { tabId: tab.id },
//       function: getPageHTML,
//     });

//     onStatusUpdate("1. Fetched Form data from the current active tab...", "success");

//     const htmlData = result[0].result;

//     // Send data to backend
//     onStatusUpdate("2. Sending data to backend...", "success");

//     const response = await fetch(`${API_BASE_URL}/users/extension/token/auto-fill/`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "Authorization": `Bearer ${token}`,
//       },
//       body: JSON.stringify({
//         html_data: htmlData,
//         user_token: token,
//       }),
//     });

//     onStatusUpdate("3. Received response from backend...", "success");

//     if (response.status !== 200) {
//       onStatusUpdate("User doesn't exist or please try again later...", "failed");
//       setTimeout(() => onStatusUpdate("", "clear"), 5000);
//       throw new Error("Backend request failed, please try again later.");
//     }

//     const fillData = await response.json();
//     let autofillData = JSON.parse(fillData["autofill_data"]);

//     // Inject autofill script into the tab
//     await chrome.scripting.executeScript({
//       target: { tabId: tab.id },
//       func: async (autofillData) => {
//         const allInputs = Array.from(
//           document.querySelectorAll("input, textarea, select, checkbox, radio, label, file")
//         );
//         let autofillIndex = 0;

//         for (const input of allInputs) {
//           if (autofillIndex >= autofillData.length) break;

//           const data = autofillData[autofillIndex];
//           const selector = Object.keys(data).find((k) => k !== "type");
//           const value = data[selector];
//           const inputType = data["type"];

//           if (!input.matches(selector)) continue;

//           try {
//             if (["input", "textarea", "select"].includes(inputType)) {
//               input.value = value;
//               input.dispatchEvent(new Event("input", { bubbles: true }));
//             } else if (inputType === "checkbox" || inputType === "radio") {
//               input.checked = value === "true";
//               input.dispatchEvent(new Event("change", { bubbles: true }));
//             } else if (inputType === "label") {
//               input.click();
//               input.dispatchEvent(new Event("change", { bubbles: true }));
//             } else if (inputType === "file") {
//               try {
//                 const directDownloadUrl = value
//                   .replace("www.dropbox.com", "dl.dropboxusercontent.com")
//                   .replace("?dl=0", "");

//                 const response = await fetch(directDownloadUrl);
//                 const blob = await response.blob();

//                 const filename = value.split("/").pop().split("?")[0] || "upload.file";
//                 const file = new File([blob], filename, { type: blob.type });
//                 const dataTransfer = new DataTransfer();
//                 dataTransfer.items.add(file);

//                 input.files = dataTransfer.files;
//                 input.dispatchEvent(new Event("change", { bubbles: true }));
//               } catch (err) {
//                 console.error(`❌ Error uploading file for ${selector}:`, err);
//               }
//             } else {
//               console.warn(`⚠️ Unknown input type "${inputType}" for ${selector}`);
//             }
//           } catch (err) {
//             console.error(`❌ Error processing ${selector}:`, err);
//           }

//           autofillIndex++;
//         }
//       },
//       args: [autofillData],
//     });

//     onStatusUpdate("4. Form auto-filled successfully!", "success");
//     setTimeout(() => onStatusUpdate("", "clear"), 5000);
//   } catch (error) {
//     onStatusUpdate("Error: " + error.message, "error");
//   }
// };
