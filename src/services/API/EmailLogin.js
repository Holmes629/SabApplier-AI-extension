/* global chrome */

// const API_BASE_URL = 'http://127.0.0.1:8000/api';
const API_BASE_URL = 'https://api.sabapplier.com/api';

export const EmailLogin = async (email, onStatusUpdate) => {
    const getPageHTML = () => {
        return document.documentElement.outerHTML;
    };

    try {
        if (!email) {
            onStatusUpdate("⚠️ Please log in to your account to continue.", "error");
            throw new Error("Email is missing. Please log in first.");
        }

        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });

        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: getPageHTML,
        });


        onStatusUpdate("✅ Collected form data from the current page.", "success");

        const htmlData = result[0].result;

        onStatusUpdate("⏳ Sending data to server for analysis...", "success");

        const response = await fetch(`${API_BASE_URL}/users/extension/auto-fill/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                html_data: htmlData,
                user_email: email,
            }),
        });

        onStatusUpdate("✅ Response received from the server.", "success");

        if (response.status !== 200) {
            onStatusUpdate("❌ Unable to find user data. Please check your email or try again later.", "failed");
            setTimeout(() => onStatusUpdate("", "clear"), 5000);
            throw new Error("Server did not return a valid response. User may not exist.");
        }

        const fillData = await response.json();
        let autofillData = JSON.parse(fillData["autofill_data"]);
        console.log("Autofill Data:", autofillData);

        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: async (autofillData) => {
                const allInputs = Array.from(
                    document.querySelectorAll("input, textarea, select, checkbox, radio, label, file")
                );
                let autofillIndex = 0;
                let input;

                while (autofillIndex < autofillData.length) {
                    const data = autofillData[autofillIndex];
                    const selector = Object.keys(data).find((k) => k !== "type");
                    const value = data[selector];
                    const inputType = data["type"];

                    try {
                        if (["input", "textarea", "select"].includes(inputType)) {
                            input = document.querySelector(selector);
                            if (!input) {autofillIndex++; continue;}
                            input.value = value;
                            input.dispatchEvent(new Event("input", { bubbles: true }));
                            console.log("input filled: ", input);
                        } else if (inputType === "checkbox") {
                            input = document.querySelector(selector);
                            if (!input) {autofillIndex++; continue;}
                            if (["false", false, 'no', 'NO', 'No', ''].includes(value)){
                                input.checked = false;
                            } else {
                                input.checked = true;
                            }
                            input.dispatchEvent(new Event("change", { bubbles: true }));
                            console.log("checkbox filled: ", input);
                        } else if (inputType === "radio") {
                            input = document.querySelector(selector);
                            if (!input) {autofillIndex++; continue;}
                            input.checked = value;
                            input.dispatchEvent(new Event("change", { bubbles: true }));
                            console.log("checkbox filled: ", input);
                        } else if (inputType === "label") {
                            input = document.querySelector(selector);
                            if (!input) {autofillIndex++; continue;}
                            input.click();
                            input.dispatchEvent(new Event("change", { bubbles: true }));
                            console.log("label filled: ", input);
                        } else if (inputType === "file") {
                            try {
                                const directDownloadUrl = value
                                    .replace("www.dropbox.com", "dl.dropboxusercontent.com")
                                    .replace("?dl=0", "");

                                const response = await fetch(directDownloadUrl);
                                const blob = await response.blob();

                                const filename = value.split("/").pop().split("?")[0] || "upload.file";
                                const file = new File([blob], filename, { type: blob.type });
                                const dataTransfer = new DataTransfer();
                                dataTransfer.items.add(file);

                                input = document.querySelector(selector);
                                if (!input) {autofillIndex++; continue;}
                                input.files = dataTransfer.files;
                                input.dispatchEvent(new Event("change", { bubbles: true }));
                                console.log("file filled: ", input);
                            } catch (err) {
                                console.error(`❌ File upload failed for ${selector}:`, err);
                            }
                        } else {
                            console.warn(`⚠️ Unknown input type "${inputType}" for ${selector}`);
                        }
                    } catch (err) {
                        console.error(`❌ Error filling input ${selector}:`, err);
                    }

                    autofillIndex++;
                }
            },
            args: [autofillData],
        });

        onStatusUpdate("✅ Step 4: Form filled successfully!", "success");
        setTimeout(() => onStatusUpdate("", "clear"), 5000);
        return fillData;
    } catch (error) {
        onStatusUpdate(`❌ Something went wrong: ${error.message}`, "error");
    }
};

export default EmailLogin;
