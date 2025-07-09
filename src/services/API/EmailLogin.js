/* global chrome */
const API_BASE_URL = 'https://api.sabapplier.com/api';
// const API_BASE_URL = 'https://api.sabapplier.com/api';
// const API_BASE_URL = 'https://sabapplier.pythonanywhere.com/api';

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
        
        console.log('Making API request to:', apiUrl);
        console.log('Request body:', { ...requestBody, html_data: '[HTML_CONTENT]' }); // Don't log full HTML
        
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
        console.log('API Response:', data);
        
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
        
        console.log('Parsed autofill data:', autofillData);
        
        // Apply autofill data to the page
        if (autofillData && Array.isArray(autofillData) && autofillData.length > 0) {
            onStatusUpdate("✅ Applying form data to page...", "info");
            
            try {
                const fillResult = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: (autofillDataArray) => {
                        // Apply autofill data to form fields
                        let filledCount = 0;
                        let filledFields = [];
                        let notFilledFields = [];
                        
                        // Process each autofill data item
                        autofillDataArray.forEach(item => {
                            // Skip items that don't have valid data
                            if (!item || typeof item !== 'object') return;
                            
                            // Extract the field selector and value from each item
                            for (const [selector, value] of Object.entries(item)) {
                                if (selector === 'type' || !value || value === null || value === 'null') {
                                    continue;
                                }
                                
                                try {
                                    const elements = document.querySelectorAll(selector);
                                    let fieldFilled = false;
                                    
                                    elements.forEach(element => {
                                        if (element && value) {
                                            const elementType = element.type?.toLowerCase() || element.tagName?.toLowerCase();
                                            
                                            if (elementType === 'checkbox' || elementType === 'radio') {
                                                element.checked = value === 'checked' || value === 'true' || value === true;
                                                fieldFilled = true;
                                            } else if (elementType === 'select-one' || elementType === 'select') {
                                                // For select elements, try to set the value
                                                element.value = value;
                                                fieldFilled = true;
                                            } else if (elementType === 'file') {
                                                // For file inputs, we can't actually set the file, but we can log it
                                                console.log(`File input ${selector} would be filled with: ${value}`);
                                                fieldFilled = true;
                                            } else {
                                                // For regular input, textarea, etc.
                                                element.value = value;
                                                fieldFilled = true;
                                            }
                                            
                                            if (fieldFilled) {
                                                // Trigger change events
                                                element.dispatchEvent(new Event('change', { bubbles: true }));
                                                element.dispatchEvent(new Event('input', { bubbles: true }));
                                                filledCount++;
                                            }
                                        }
                                    });
                                    
                                    if (fieldFilled) {
                                        filledFields.push(selector);
                                    } else {
                                        notFilledFields.push(selector);
                                    }
                                } catch (selectorError) {
                                    console.warn(`Failed to process selector ${selector}:`, selectorError);
                                    notFilledFields.push(selector);
                                }
                            }
                        });
                        
                        return {
                            filledCount,
                            filledFields,
                            notFilledFields
                        };
                    },
                    args: [autofillData]
                });
                
                const fillResults = fillResult[0].result;
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
                        filledCount: fillResults.filledCount
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
                    filledCount: 0
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
