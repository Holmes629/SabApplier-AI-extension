import React, { useState, useEffect } from 'react';
import Footer from './Footer';
import { Database } from 'lucide-react';

const YourDetails = ({ user }) => {

    const [notFilledData, setNotFilledData] = useState(null);

    useEffect(() => {
        chrome.storage.session.get('autoFillDataResult', (data) => {
            console.log('Retrieved temporary response:', data.autoFillDataResult.fillResults.notFilled);
            setNotFilledData(data.autoFillDataResult.fillResults.notFilled);
        });
    }, []);

    const copyToClipboard = (text, fieldName) => {
        navigator.clipboard.writeText(text).then(() => {
            setStatus(`${fieldName} copied to clipboard!`);
            setTimeout(() => setStatus(''), 2000);
        }, () => {
            setStatus('Failed to copy.');
            setTimeout(() => setStatus(''), 2000);
        });
    };

    const downloadFile = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();

            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename || "downloaded_file";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl); // Cleanup
        } catch (err) {
            console.error("❌ Failed to download file:", err);
        }
    };


    const highlightFormField = (selector) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) return;

            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: (selector) => {
                    try {
                        const el = document.querySelector(selector);
                        if (!el) return;

                        // Add highlight styles
                        el.style.outline = '3px solid #3b82f6';
                        el.style.outlineOffset = '2px';
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } catch (e) {
                        console.warn('Invalid selector', selector);
                    }
                },
                args: [selector]
            });
        });
    };

    const removeHighlight = (selector) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) return;

            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: (selector) => {
                    try {
                        const el = document.querySelector(selector);
                        if (!el) return;
                        el.style.outline = '';
                        el.style.outlineOffset = '';
                    } catch (e) {
                        console.warn('Invalid selector', selector);
                    }
                },
                args: [selector]
            });
        });
    };


    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            {/* Main Content */}
            <div className="flex-1 w-full mx-auto px-3 pt-20 pb-3 space-y-3 overflow-y-auto">
                {/* Enhanced Header */}
                <div className="text-center mb-3 animate-fadeIn">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <Database className="w-5 h-5 text-blue-600" />
                        <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">Form Data</h1>
                    </div>
                    <p className="text-xs text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Trouble filling form fields data.
                    </p>
                </div>

                {/* Data List */}
                {(notFilledData && notFilledData.length > 0) ? (
                    <div className="space-y-2 mb-4">
                        {notFilledData.map((item, index) => {
                            const inputName = Object.keys(item).find(key => key !== 'file' && key !== 'type' && key !== 'selector');
                            const inputType = item["type"];
                            const selector = item["selector"];
                            const value = item[inputName];
                            return (
                                <div key={index} 
                                    className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm flex items-center"
                                    onMouseEnter={() => highlightFormField(selector)}
                                    onMouseLeave={() => removeHighlight(selector)}
                                >
                                    <div className="mr-3 w-3 h-3 accent-blue-600"> {index + 1} </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <div>
                                                <h4 className="font-semibold text-gray-900 text-xs">
                                                    {inputName}
                                                </h4>
                                            </div>
                                            {value && (
                                                <div className="flex gap-2">
                                                    {inputType === 'file' ? (
                                                        <button
                                                            onClick={() => downloadFile(item?.file?.['file_url'], inputName)}
                                                            className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition font-semibold"
                                                        >
                                                            Download
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => copyToClipboard(value, inputName)}
                                                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition font-semibold"
                                                        >
                                                            Copy
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-gray-700 text-xs">
                                            {!value ? (
                                                <span className="text-gray-400 italic">No data</span>
                                            ) : (
                                                <div className="bg-gray-50 rounded p-2 border border-gray-200 break-all">
                                                    {value}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>) : (
                    <div className="text-center text-gray-500 mt-10">
                        <p className="text-sm">No fields to display.</p>
                    </div>
                )}
            </div>
            {/* Footer */}
            <Footer />
        </div>
    );
};

export default YourDetails; 