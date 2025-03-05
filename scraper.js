(async () => {
    const rows = document.querySelectorAll("#tblStockList tr");
    const stockData = [];

    for (const row of rows) {
        const firstColLink = row.querySelector("td:first-child a");
        if (firstColLink) {
            const url = firstColLink.getAttribute("onclick").match(/"(.*?)"/)[1];

            try {
                // Fetch the page content
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

                const pageText = await response.text();

                // Create a temporary DOM parser
                const parser = new DOMParser();
                const doc = parser.parseFromString(pageText, "text/html");

                // Locate all rating blocks
                const ratingBlocks = doc.querySelectorAll("ul.smartRating");
                const ratings = {
                    epsRating: 0,
                    rsRating: 0,
                    smrRating: "",
                    accDisRating: "",
                    volume: 0,
                    volumeChange: 0,
                    volumeDirection: ""
                };

                ratingBlocks.forEach(block => {
                    const label = block.querySelector("li:first-child .typespan");
                    if (label) {
                        const ratingType = label.textContent.trim();
                        const valueElement = block.querySelector("li:nth-child(2)");

                        if (valueElement) {
                            const ratingValue = valueElement.textContent.trim();

                            if (ratingType === "EPS Rating") {
                                ratings.epsRating = parseInt(ratingValue, 10);
                            } else if (ratingType === "RS Rating") {
                                ratings.rsRating = parseInt(ratingValue, 10);
                            } else if (ratingType === "SMR Rating") {
                                ratings.smrRating = ratingValue;
                            } else if (ratingType === "Acc/Dis Rating") {
                                ratings.accDisRating = ratingValue;
                            }
                        }
                    }
                });

                // Extract Volume
                const volumeElement = doc.querySelector("div.volPrice span#NormalCase");
                if (volumeElement) {
                    let extractedVolume = parseInt(volumeElement.textContent.replace(/,/g, ""), 10);
                    
                    // Convert to millions if the extracted value is too low
                    if (extractedVolume <= 1000) {
                        extractedVolume *= 1000000;
                    }
                    ratings.volume = extractedVolume;
                }

                // Extract Volume % Change & Direction
                const volumeChangeElement = doc.querySelector("ul.volPricePer li");
                if (volumeChangeElement) {
                    ratings.volumeChange = parseInt(volumeChangeElement.textContent.replace("%", ""), 10);
                    ratings.volumeDirection = volumeChangeElement.classList.contains("up") ? "Up" : "Down";
                }

                // Extract stock symbol
                const stockSymbol = firstColLink.textContent.trim();

                // **Apply Filters**
                if (
                    ratings.epsRating >= 90 &&
                    ratings.rsRating >= 80 &&
                    (ratings.smrRating === "A" || ratings.smrRating === "A-") &&
                    (ratings.accDisRating === "A" || ratings.accDisRating === "A-") &&
                    ratings.volumeDirection === "Up" &&
                    ratings.volume >= 1000000
                ) {
                    stockData.push({ stockSymbol, ...ratings });
                    console.log(`Stock: ${stockSymbol}, EPS: ${ratings.epsRating}, RS: ${ratings.rsRating}, SMR: ${ratings.smrRating}, Acc/Dis: ${ratings.accDisRating}, Volume: ${ratings.volume.toLocaleString()}, Volume Change: ${ratings.volumeChange}% (${ratings.volumeDirection})`);
                }
            } catch (error) {
                console.error(`Error fetching ${url}:`, error);
            }
        }
    }
    console.log("Final Filtered Stock Data:", JSON.stringify(stockData));
})();
