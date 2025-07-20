/* global chrome */

const API_BASE_URL = 'https://api.sabapplier.com/api';
// const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const EmailLogin = async (params, onStatusUpdate) => {
    try {
        // Handle different parameter formats
        // If params is a string, it's the user email (backward compatibility)
        // If params is an object, it contains user email and possibly shared account details
        
        let userEmail, sharedAccountEmail, shareId;
        
        if (typeof params === 'string') {
            userEmail = params;
        } else if (typeof params === 'object') {
            userEmail = params.userEmail;
            sharedAccountEmail = params.sharedAccountEmail;
            shareId = params.shareId;
        } else {
            throw new Error("Invalid parameters. Please log in again.");
        }
        
        if (!userEmail) {
            onStatusUpdate("⚠️ Please log in to your account to continue.", "error");
            throw new Error("Email is missing. Please log in first.");
        }
        
        // Log autofill parameters for debugging
        console.log('EmailLogin running with:', {
            userEmail,
            usingSharedAccount: !!sharedAccountEmail,
            sharedAccountEmail: sharedAccountEmail || 'N/A',
            shareId: shareId || 'N/A'
        });

        // Check if chrome API is available
        if (!chrome?.tabs?.query || !chrome?.scripting?.executeScript) {
            onStatusUpdate("⚠️ Chrome API not available. This could be a temporary issue.", "error");
            return { error: "Chrome API not available" };
        }

        // Safe query for active tab
        let tab;
        try {
            const tabs = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });
            
            if (!tabs || tabs.length === 0) {
                onStatusUpdate("⚠️ No active tab found. Please refresh and try again.", "error");
                return { error: "No active tab found" };
            }
            
            tab = tabs[0];
        } catch (error) {
            console.error("Error querying tabs:", error);
            onStatusUpdate("⚠️ Error accessing tab. Please refresh and try again.", "error");
            return { error: "Tab query failed" };
        }

        // Get HTML content from the active tab
        onStatusUpdate("📄 Reading form data from page...", "info");
        
        let htmlContent;
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => document.documentElement.outerHTML,
            });
            
            if (!results || results.length === 0 || !results[0].result) {
                throw new Error("Failed to read page content");
            }
            
            htmlContent = results[0].result;
        } catch (error) {
            console.error("Error reading page content:", error);
            onStatusUpdate("⚠️ Could not read page content. Please try again.", "error");
            return { error: "Failed to read page content" };
        }

        // Prepare API request
        onStatusUpdate(sharedAccountEmail ? 
            `🔄 Processing autofill with ${sharedAccountEmail.split('@')[0]}'s data...` : 
            "🔄 Processing autofill with your data...", "info");
        
        const apiUrl = `${API_BASE_URL}/users/extension/auto-fill/`;
        const requestBody = {
            html_data: htmlContent,
            user_email: userEmail,
            // Include shared account parameters if available
            ...(sharedAccountEmail && { shared_account_email: sharedAccountEmail }),
            ...(shareId && { share_id: shareId })
        };
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', response.status, errorText);
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Parse autofill_data if it's a JSON string
        let autofillData = data.autofill_data;
        if (typeof autofillData === 'string') {
            try {
                autofillData = JSON.parse(autofillData);
            } catch (parseError) {
                console.error('Failed to parse autofill data:', parseError);
                throw new Error('Invalid autofill data format received from server');
            }
        }
        
        console.log('autofill data:', autofillData);
        
        // Apply autofill data to the page
        if (autofillData && Array.isArray(autofillData) && autofillData.length > 0) {
            onStatusUpdate("✅ Applying form data to page...", "info");
            
            try {
                const fillResult = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: async (autofillData) => {
                        // cloudinary function for documents compression or expansion, and resizing.
                        const uploadFileToCloudinary = async (dropboxUrl, filename, file_type, targetSize, pixels) => {
                            const cloudinaryUrl = "https://api.cloudinary.com/v1_1/detvvagxg/auto/upload";
                            const uploadPreset = "unsigned_preset_for_extension"; // Replace with your actual preset

                            const response = await fetch(dropboxUrl);
                            const blob = await response.blob();

                            const formData = new FormData();
                            formData.append("file", blob);
                            formData.append("upload_preset", uploadPreset);

                            const cloudRes = await fetch(cloudinaryUrl, {
                                method: "POST",
                                body: formData,
                            });

                            if (!cloudRes.ok) throw new Error("Cloudinary upload failed");

                            const data = await cloudRes.json();

                            // Build transformed URL
                            try {
                                const allowedTypes = ['jpg', 'jpeg', 'png', 'pdf'];
                                file_type = file_type.split(',')[0].trim().toLowerCase().replace('.', '');
                                if (!allowedTypes.includes(file_type)) {
                                    file_type = 'jpg'; // default will be jpg
                                }
                            } catch (err) {
                                console.log('error with file_type: ', err);
                                file_type = 'jpg';
                            }
                            let pixels_w = 600; let pixels_h = 800;
                            try {
                                [pixels_w, pixels_h] = pixels.toLowerCase().replace(/[^0-9x]/g, '').split('x').map(Number);
                            } catch (err) {
                                console.log('error occured with pixels: ', err);
                                pixels_w = 600; pixels_h = 800;
                            }
                            console.log('filename, file_type, size, pixels:', filename, file_type, pixels_w, pixels_h);
                            
                            const publicId = data.public_id;
                            for (let quality = 100; quality >= 20; quality -= 5) {
                                const transformedUrl = `https://res.cloudinary.com/detvvagxg/image/upload/f_${file_type},w_${pixels_w},h_${pixels_h},q_${quality},c_fill,g_auto/${publicId}`;
                                
                                const uploadedBlob = await fetch(transformedUrl).then(res => res.blob());
                                const file_name = `${ filename || data.original_filename }.${file_type}`;
                                const sizeKB = uploadedBlob.size / 1024;

                                console.log(`Quality ${quality}: ${sizeKB.toFixed(2)} KB`);

                                if (sizeKB <= targetSize + 5 || sizeKB >= targetSize - 5) {
                                    console.log('filename: ', file_name, uploadedBlob.size/ 1024);
                                    const file = new File([uploadedBlob], file_name, { type: uploadedBlob.type })
                                    return { 'blob': file, 'file_url': transformedUrl };
                                }
                            }
                            file = new File([blob], filename, { type: blob.type });
                            return { 'blob': file, 'file_url': dropboxUrl };
                        };
                        // ------------------------------- x ---------------------------------

                        // Apply autofill data to form fields
                        let filledCount = 0;
                        let filledFields = [];
                        let notFilledFields = [];
                        let autoFillData2 = {};
                        let autofillIndex = 0;
                        let input;

                        while (autofillIndex < autofillData.length) {
                            const data = autofillData[autofillIndex];
                            const selector = Object.keys(data).find((k) => k !== "type" && k !== "file_name" && k !== "file_type" && k !== "pixels" && k !== "size");
                            const value = data[selector];
                            const inputType = data["type"] || selector.split('[')[0];

                            try {
                                if (["input", "textarea", "select"].includes(inputType)) {
                                    input = document.querySelector(selector);
                                    if (!input) { autofillIndex++; continue; }
                                    input.value = String(value);
                                    input.dispatchEvent(new Event("input", { bubbles: true }));
                                    autoFillData2[input.name] = value;
                                    if (input != null && input.value != value) {
                                        notFilledFields.push({[input.name]: value, type: inputType, selector: selector});
                                        console.warn(`⚠️ Input not filled correctly: ${selector} (expected: ${value}, got: ${input.value})`);
                                    } else {
                                        filledFields.push({[input.name]: value});
                                        console.log("input filled: ", input, value);
                                    }
                                } else if (inputType === "checkbox") {
                                    input = document.querySelector(selector);
                                    if (!input) { autofillIndex++; continue; }
                                    autoFillData2[input.name] = value;
                                    if (["false", false, 'no', 'NO', 'No', '', 'unchecked'].includes(value)) {
                                        input.checked = false;
                                    } else {
                                        input.checked = true;
                                    }
                                    input.dispatchEvent(new Event("change", { bubbles: true }));
                                    if (!input.checked) {
                                        notFilledFields.push({[input.name]: value, type: inputType, selector: selector});
                                        console.warn(`⚠️ Checkbox not filled correctly: ${selector} (expected: ${value}, got: ${input.checked})`);
                                    } else {
                                        filledFields.push({[input.name]: value});
                                        console.log("checkbox filled: ", input, value);
                                    }
                                } else if (inputType === "radio") {
                                    input = document.querySelector(selector);
                                    input.checked = value;
                                    autoFillData2[input.name] = value;
                                    input.dispatchEvent(new Event("change", { bubbles: true }));
                                    if (input.value !== (value === true || value === 'true' || value === 'yes' || value === 'YES' || value === 'Yes')) {
                                        notFilledFields.push({[input.name]: value, type: inputType, selector: selector});
                                        console.warn(`⚠️ Radio not filled correctly: ${selector} (expected: ${value}, got: ${input.checked})`);
                                    } else {
                                        filledFields.push({[input.name]: value});
                                        console.log("radio filled: ", input, value);
                                    }
                                } else if (inputType === "label") {
                                    input = document.querySelector(selector);
                                    if (!input) { autofillIndex++; continue; }
                                    input.click();
                                    autoFillData2[input.name] = value;
                                    input.dispatchEvent(new Event("change", { bubbles: true }));
                                    if (input.textContent.trim() !== value.trim()) {
                                        notFilledFields.push({[input.name]: value, type: inputType, selector: selector});
                                        console.warn(`⚠️ Label not filled correctly: ${selector} (expected: ${value}, got: ${input.textContent.trim()})`);
                                    } else {
                                        filledFields.push({[input.name]: value});
                                        console.log("label filled: ", input, value);
                                    }
                                } else if (inputType === "file") {
                                    try {
                                        const dropbox_url = value
                                            .replace("www.dropbox.com", "dl.dropboxusercontent.com")
                                            .replace("?dl=0", "");

                                        // Get quality for compression
                                        let quality = 100;
                                        let actualSize = 'error';
                                        let targetSize = 'error';
                                        try {
                                            targetSize = parseFloat(data["size"]) || 20; // expected in KB
                                            const response = await fetch(dropbox_url, { method: "HEAD" });
                                            const sizeBytes = parseInt(response.headers.get("Content-Length"), 10);
                                            actualSize =  sizeBytes / 1024; // convert to KB
                                            quality = Math.min(100, Math.floor((targetSize / actualSize) * 100));
                                        } catch (err) {
                                            console.log('error while calculating compression: ', err);
                                            quality = 100;
                                        }
                                        
                                        console.log("while filling image: ", dropbox_url, data['file_name'], data["file_type"] || data['file_name'].split('.')[1], actualSize, targetSize, quality, data["pixels"])
                                        const filename = data['file_name']?.split('.')[0] || value.split("/").pop().split("?")[0];
                                        const file = await uploadFileToCloudinary(dropbox_url, filename, data["file_type"], targetSize, data["pixels"]);
                                        const dataTransfer = new DataTransfer();
                                        dataTransfer.items.add(file['blob']);

                                        input = document.querySelector(selector);
                                        if (!input) { autofillIndex++; continue; }
                                        input.files = dataTransfer.files;
                                        input.dispatchEvent(new Event("change", { bubbles: true }));
                                        autoFillData2[input.name] = file['file_url'] || value;
                                        notFilledFields.push({[input.name]: file.name, file: file, type: inputType, selector: selector});
                                        if (dataTransfer.files != null && (input.files.length === 0 || input.files[0].name !== file.name)) {
                                            notFilledFields.push({[input.name]: file['blob'].name, file: file, type: inputType, selector: selector});
                                            console.log(`⚠️ File upload failed for ${selector}: expected ${file.name}, got ${input.files[0]?.name || 'none'}`);
                                        } else {
                                            filledFields.push({[input.name]: value, type: inputType, selector: selector});
                                            console.log("file filled: ", input, filename);
                                        }
                                    } catch (err) {
                                        console.error(`❌ File upload failed for ${selector}:`, err);
                                    }
                                } else {
                                    console.warn(`⚠️ Unknown input type "${inputType}" for ${selector}`);
                                }
                            } catch (err) {
                                console.error(`❌ Error filling input ${selector}:`, err);
                            }
                            filledCount++;
                            autofillIndex++;
                        }
                        
                        return {
                            filledCount: filledCount,
                            filledFields: filledFields,
                            notFilledFields: notFilledFields,
                            autoFillData2: autoFillData2,
                        };
                    },
                    args: [autofillData]
                });
                
                const fillResults = fillResult[0]?.result;
                console.log('Fill results:', fillResults);
                
                if (fillResults.filledCount > 0) {
                    onStatusUpdate(`✅ Form filled successfully! ${fillResults.filledCount} fields filled.`, "success");
                } else {
                    onStatusUpdate("ℹ️ No matching form fields found on this page.", "info");
                }
                
                return {
                    success: true,
                    message: `Form filled successfully. ${fillResults.filledCount} fields filled.`,
                    dataSource: data.data_source || 'unknown',
                    sourceEmail: data.source_email || userEmail,
                    fillResults: {
                        filled: fillResults.filledFields,
                        notFilled: fillResults.notFilledFields,
                        filledCount: fillResults.filledCount,
                        autoFillData2: fillResults.autoFillData2
                    }
                };
                
            } catch (error) {
                console.error("Error applying autofill data:", error);
                onStatusUpdate("⚠️ Form data retrieved but failed to apply. Please try again.", "error");
                return { error: "Failed to apply autofill data" };
            }
        } else {
            onStatusUpdate("ℹ️ No matching form fields found on this page.", "info");
            return {
                success: true,
                message: "No matching form fields found",
                fillResults: {
                    filled: [],
                    notFilled: [],
                    filledCount: 0,
                    autofillData: autofillData
                }   
            };
        }
        
    } catch (error) {
        console.error("EmailLogin error:", error);
        onStatusUpdate(`❌ Something went wrong: ${error.message}`, "error");
        return { error: error.message };
    }
};

export default EmailLogin;