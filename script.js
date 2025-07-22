const map = L.map('mapid').setView([13.7563, 100.5018], 6);
let geoJsonLayer;
let labelLayerGroup = L.featureGroup().addTo(map);
let allAggregatedData; // Stores aggregated data for all hospitals
let rawGeojsonData; // Stores the original, unaggregated GeoJSON data
let legend;
const customTooltip = document.getElementById('customTooltip');

// Define the desired order for outcomes in the chart and legend
const outcomeDisplayOrder = [
    'Completed',
    'Cured',
    'On treatment',
    'Transferred out',
    'Died',
    'Lost to follow-up',
    'Failed', // Assuming 'Failed' might exist or be added.
    'RR/MDR ก่อนเดือนที่ 5',
    'Change diagnosis',
    'ไม่ระบุ' // Always include 'ไม่ระบุ' at the end
];

// Define a mapping from outcome names to CSS class names for colors
// Ensure this list is exhaustive of all possible outcomes
const outcomeColorClasses = {
    'Completed': 'outcome-Completed',
    'Cured': 'outcome-Cured',
    'On treatment': 'outcome-OnTreatment',
    'Transferred out': 'outcome-TransferredOut',
    'Died': 'outcome-Died',
    'Lost to follow-up': 'outcome-LostToFollowUp',
    'Failed': 'outcome-Failed',
    'RR/MDR ก่อนเดือนที่ 5': 'outcome-RRMDRBeforeMonth5',
    'Change diagnosis': 'outcome-ChangeDiagnosis',
    'ไม่ระบุ': 'outcome-Undefined'
};

// NEW: Define gender display order and color classes
const genderDisplayOrder = ['ชาย', 'หญิง', 'ไม่ระระบุเพศ'];
const genderColorClasses = {
    'ชาย': 'gender-Male',
    'หญิง': 'gender-Female',
    'ไม่ระระบุเพศ': 'gender-UndefinedGender'
};

// NEW: Define risk level display order and color classes based on user's full list
const riskLevelDisplayOrder = [
    // ประชากรเสี่ยงต่อวัณโรค
    'บุคลากรสาธารณสุขดูแลผู้ป่วย**',
    'ประชากรข้ามชาติ',
    'ผู้ต้องขังในเรือนจำ (รายเก่า)**',
    'ผู้ต้องขังในเรือนจำ (รายใหม่)**',
    'ผู้ป่วยติดบ้านติดเตียง',
    'ผู้อาศัยในชุมชนแออัด/ค่ายอพยพ',
    'ผู้อาศัยในสถานพินิจ**',

    // ผู้ที่มีโรคหรือภาวะเสี่ยงต่อวัณโรค
    'ผู้ติดยาเสพติด**',
    'ผู้ที่สูบบุหรี่**',
    'ผู้ป่วย B24**',
    'ผู้ป่วยจิตเวช',
    'ผู้ป่วยผ่าตัดกระเพาะ ตัดต่อลำใส้',
    'ผู้ป่วยโรคไตเรื้อรัง**',
    'ผู้ป่วยโรคมะเร็ง',
    'ผู้มีความผิดปกติจากการติดสุรา**',
    'ผู้มีประวัติเป็นวัณโรค',
    'โรคที่ได้รับยากดภูมิคุ้มกัน**',
    'โรคเบาหวาน**',
    'โรคเบาหวานที่คุมไม่ได้ (HbA1C ? 7 mg% หรือ FBS**',
    'โรคปอดอุดกั้นเรื้อรัง (COPD)**',
    'อื่นๆ',

    // ผู้สัมผัสวัณโรค
    'ผู้สัมผัสใกล้ชิด (นอกบ้าน)**',
    'ผู้สัมผัสร่วมบ้าน**',

    // ไม่มีกลุ่มเสี่ยง
    'ไม่มีความเสี่ยง',
    'ไม่ระบุความเสี่ยง' // Fallback for undefined data
];

const riskLevelColorClasses = {
    // ประชากรเสี่ยงต่อวัณโรค (โทนสีฟ้า-เขียว)
    'บุคลากรสาธารณสุขดูแลผู้ป่วย**': 'risk-health-personnel',
    'ประชากรข้ามชาติ': 'risk-migrant',
    'ผู้ต้องขังในเรือนจำ (รายเก่า)**': 'risk-prisoner-old',
    'ผู้ต้องขังในเรือนจำ (รายใหม่)**': 'risk-prisoner-new',
    'ผู้ป่วยติดบ้านติดเตียง': 'risk-bedridden',
    'ผู้อาศัยในชุมชนแออัด/ค่ายอพยพ': 'risk-slum-camp',
    'ผู้อาศัยในสถานพินิจ**': 'risk-detention-center',

    // ผู้ที่มีโรคหรือภาวะเสี่ยงต่อวัณโรค (โทนสีม่วง-แดง-น้ำตาล)
    'ผู้ติดยาเสพติด**': 'risk-drug-addict',
    'ผู้ที่สูบบุหรี่**': 'risk-smoker',
    'ผู้ป่วย B24**': 'risk-b24-patient',
    'ผู้ป่วยจิตเวช': 'risk-mental-illness',
    'ผู้ป่วยผ่าตัดกระเพาะ ตัดต่อลำใส้': 'risk-gastric-surgery',
    'ผู้ป่วยโรคไตเรื้อรัง**': 'risk-ckd',
    'ผู้ป่วยโรคมะเร็ง': 'risk-cancer',
    'ผู้มีความผิดปกติจากการติดสุรา**': 'risk-alcohol-disorder',
    'ผู้มีประวัติเป็นวัณโรค': 'risk-history-tb',
    'โรคที่ได้รับยากดภูมิคุ้มกัน**': 'risk-immunosuppressed',
    'โรคเบาหวาน**': 'risk-diabetes',
    'โรคเบาหวานที่คุมไม่ได้ (HbA1C ? 7 mg% หรือ FBS**': 'risk-uncontrolled-diabetes',
    'โรคปอดอุดกั้นเรื้อรัง (COPD)**': 'risk-copd',
    'อื่นๆ': 'risk-other-medical',

    // ผู้สัมผัสวัณโรค (โทนสีเหลือง-ทอง)
    'ผู้สัมผัสใกล้ชิด (นอกบ้าน)**': 'risk-close-contact-out',
    'ผู้สัมผัสร่วมบ้าน**': 'risk-household-contact',

    // ไม่มีกลุ่มเสี่ยง (โทนสีเทา)
    'ไม่มีความเสี่ยง': 'risk-no-risk',
    'ไม่ระบุความเสี่ยง': 'risk-undefined-risk' // Specific class for undefined
};


// NEW: Define age group order for consistent display
const ageGroupOrder = [
    '0-4 ปี', '5-9 ปี', '10-14 ปี', '15-24 ปี', '25-34 ปี',
    '35-44 ปี', '45-54 ปี', '55-64 ปี', '65-100 ปี', 'ไม่ระบุ/เกิน 100 ปี'
];

// NEW: Define comorbidity fields, display names, and color classes
const comorbidityFields = [
    'โรคร่วม-COPD', 'โรคร่วม-CKD', 'โรคร่วม-LD',
    'โรคร่วม-CA', 'โรคร่วม-DM', 'โรคร่วม-HT'
];

const comorbidityDisplayNames = {
    'โรคร่วม-COPD': 'COPD',
    'โรคร่วม-CKD': 'CKD',
    'โรคร่วม-LD': 'LD',
    'โรคร่วม-CA': 'CA',
    'โรคร่วม-DM': 'DM',
    'โรคร่วม-HT': 'HT',
    'ไม่มีโรคร่วม': 'ไม่มีโรคร่วม', // For patients with no 'Y' comorbidities
    'ไม่ระบุโรคร่วม': 'ไม่ระบุโรคร่วม' // For undefined data
};

const comorbidityColorClasses = {
    'COPD': 'comorbidity-COPD',
    'CKD': 'comorbidity-CKD',
    'LD': 'comorbidity-LD',
    'CA': 'comorbidity-CA',
    'DM': 'comorbidity-DM',
    'HT': 'comorbidity-HT',
    'ไม่มีโรคร่วม': 'comorbidity-NoComorbidity',
    'ไม่ระบุโรคร่วม': 'comorbidity-Undefined'
};


L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const part1Url = 'final_data_reduced_part_1.geojson';
const part2Url = 'final_data_reduced_part_2.geojson';

// โหลดและรวมไฟล์ GeoJSON ทั้งสองไฟล์
async function loadAndCombineGeoJSON() {
    try {
        const [response1, response2] = await Promise.all([
            fetch(part1Url),
            fetch(part2Url)
        ]);

        if (!response1.ok || !response2.ok) {
            throw new Error('ไม่สามารถดึงข้อมูลจากไฟล์ GeoJSON ได้');
        }

        const data1 = await response1.json();
        const data2 = await response2.json();
        return {
            "type": "FeatureCollection",
            "features": [...data1.features, ...data2.features]
        };
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดหรือรวมไฟล์:", error);
        return null;
    }
}

// รวมข้อมูลผู้ป่วยตาม จังหวัด-อำเภอ-ตำบล
function aggregateData(geojsonData) {
    const aggregatedFeatures = {};
    geojsonData.features.forEach(feature => {
        const props = feature.properties;
        const geoKey = `${props['จังหวัด']}-${props['อำเภอ']}-${props['ตำบล']}`;
        // Use 'ไม่ระบุ' if outcome is null or undefined
        const outcome = props['ผลการรักษา'] || 'ไม่ระบุ';

        if (!aggregatedFeatures[geoKey]) {
            aggregatedFeatures[geoKey] = {
                type: 'Feature',
                geometry: feature.geometry,
                properties: {
                    'จังหวัด': props['จังหวัด'],
                    'อำเภอ': props['อำเภอ'],
                    'ตำบล': props['ตำบล'],
                    'total_count': 0,
                    'outcome_counts': {}
                }
            };
        }

        aggregatedFeatures[geoKey].properties.total_count++;

        if (!aggregatedFeatures[geoKey].properties.outcome_counts[outcome]) {
            aggregatedFeatures[geoKey].properties.outcome_counts[outcome] = 0;
        }
        aggregatedFeatures[geoKey].properties.outcome_counts[outcome]++;
    });

    return {
        "type": "FeatureCollection",
        "features": Object.values(aggregatedFeatures)
    };
}

// กำหนดสีตามจำนวนผู้ป่วย (สำหรับแผนที่)
function getColorForCount(count) {
    return count > 50 ? '#800026' :
        count > 20 ? '#BD0026' :
            count > 10 ? '#E31A1C' :
                count > 5 ? '#FC4E2A' :
                    count > 2 ? '#FD8D3C' :
                        count > 0 ? '#FED976' :
                            '#f0f0f0';
}

// สร้าง popup สำหรับแต่ละ feature (แค่ bind popup ไม่ใส่ event hover)
function onEachFeature(feature, layer) {
    const props = feature.properties;
    const totalCount = props['total_count'];
    let popupContent = `
            <b>จังหวัด:</b> ${props['จังหวัด']}<br>
            <b>อำเภอ:</b> ${props['อำเภอ']}<br>
            <b>ตำบล:</b> ${props['ตำบล']}<br>
            <hr>
            <b>ยอดรวมผู้ป่วย:</b> ${totalCount}<br>
            <hr>
            <b>แบ่งตามผลการรักษา:</b><br>
        `;

    // Sort outcomes for popup consistently (alphabetically or by custom order if desired for popup too)
    // For popup, alphabetical sorting is generally fine for readability
    const sortedOutcomes = Object.keys(props.outcome_counts).sort();
    for (const outcome of sortedOutcomes) {
        const outcomeCount = props.outcome_counts[outcome] || 0;
        const percentage = totalCount > 0 ? ((outcomeCount / totalCount) * 100).toFixed(1) : 0;
        popupContent += `• ${outcome}: ${outcomeCount} ราย (${percentage}%)<br>`;
    }

    layer.bindPopup(popupContent);
}

// สร้าง Dropdown สำหรับอำเภอ
function createDistrictFilter(districts) {
    const selectElement = document.getElementById('district-filter');
    districts.forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        selectElement.appendChild(option);
    });
    selectElement.addEventListener('change', applyFilters);
}

// สร้าง Dropdown สำหรับผลการรักษา
function createOutcomeFilter(outcomes) {
    const selectElement = document.getElementById('outcome-filter');
    outcomes.forEach(outcome => {
        const option = document.createElement('option');
        option.value = outcome;
        option.textContent = outcome;
        selectElement.appendChild(option);
    });
    selectElement.addEventListener('change', applyFilters);
}

// สร้าง Dropdown สำหรับโรงพยาบาล
function createHospitalFilter(hospitals) {
    const selectElement = document.getElementById('hospital-filter');
    hospitals.forEach(hospital => {
        const option = document.createElement('option');
        option.value = hospital;
        option.textContent = hospital;
        selectElement.appendChild(option);
    });
    selectElement.addEventListener('change', applyFilters);
}

// อัพเดท Legend บนแผนที่
function updateLegend(selectedOutcome) {
    if (legend) {
        legend.remove();
    }

    legend = L.control({ position: 'bottomright' });
    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'info-box legend');
        const grades = [1, 2, 5, 10, 20, 50];
        const legendTitle = selectedOutcome === 'ทั้งหมด' ? 'จำนวนผู้ป่วย' : `จำนวนผู้ป่วย (${selectedOutcome})`;

        div.innerHTML = `<b>${legendTitle}</b><br>`;
        for (let i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<div><i style="background:' + getColorForCount(grades[i] + 1) + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+') + '</div>';
        }
        return div;
    };
    legend.addTo(map);
}

// เพิ่มป้ายกำกับจำนวนผู้ป่วยและชื่อตำบลบนแผนที่
function addLabelsToMap(geoJsonData, selectedOutcome) {
    labelLayerGroup.clearLayers(); // Clear existing labels

    // Only show labels if an specific outcome is selected (not 'ทั้งหมด')
    if (selectedOutcome === 'ทั้งหมด') {
        return;
    }

    geoJsonData.features.forEach(feature => {
        const props = feature.properties;
        let labelText;
        let count = props.outcome_counts[selectedOutcome] || 0;

        // Only create label if count for the selected outcome is greater than 0
        if (count > 0) {
            const totalCountInTambon = props.total_count;
            const percentage = totalCountInTambon > 0 ? ((count / totalCountInTambon) * 100).toFixed(1) : 0;
            labelText = `${props['ตำบล']}<br>(${count} ราย, ${percentage}%)`;

            const centroid = L.geoJSON(feature.geometry).getBounds().getCenter();
            const labelIcon = L.divIcon({
                className: 'map-label-div-icon',
                html: labelText,
                iconSize: [0, 0], // Let content size the icon
                iconAnchor: [0, 0] // Centered by CSS transform
            });

            // Using L.marker with custom divIcon for labels
            L.marker(centroid, { icon: labelIcon }).addTo(labelLayerGroup);
        }
    });
}

// ฟังก์ชันสำหรับเตรียมข้อมูลและสร้าง/อัพเดทกราฟแท่งแนวนอน (Stacked)
function renderStaticHospitalChart(data) {
    const hospitalOutcomeCounts = {}; // { hospitalName: { outcome1: count, outcome2: count, ... }, ... }
    const allOutcomesPresent = new Set(); // To collect all unique outcomes for the legend

    // Calculate overall province data first
    let overallProvinceCounts = { total: 0 };

    data.features.forEach(feature => {
        const hospital = feature.properties['โรงพยาบาล'] || 'ไม่ระบุ';
        const outcome = feature.properties['ผลการรักษา'] || 'ไม่ระบุ';

        // Aggregate for individual hospitals
        if (!hospitalOutcomeCounts[hospital]) {
            hospitalOutcomeCounts[hospital] = { total: 0 };
        }
        if (!hospitalOutcomeCounts[hospital][outcome]) {
            hospitalOutcomeCounts[hospital][outcome] = 0;
        }
        hospitalOutcomeCounts[hospital][outcome]++;
        hospitalOutcomeCounts[hospital].total++;

        // Aggregate for overall province
        if (!overallProvinceCounts[outcome]) {
            overallProvinceCounts[outcome] = 0;
        }
        overallProvinceCounts[outcome]++;
        overallProvinceCounts.total++;

        allOutcomesPresent.add(outcome);
    });

    const sortedHospitals = Object.entries(hospitalOutcomeCounts).sort(([, countsA], [, countsB]) => countsB.total - countsA.total);

    const chartContainer = document.getElementById('staticHospitalChart');
    chartContainer.innerHTML = ''; // Clear existing bars
    if (sortedHospitals.length === 0 && overallProvinceCounts.total === 0) {
        chartContainer.innerHTML = '<p style="text-align: center; color: #777;">ไม่มีข้อมูลผู้ป่วยสำหรับโรงพยาบาล</p>';
        document.getElementById('outcomeChartLegend').innerHTML = ''; // Clear legend too
        return;
    }

    // Render Overall Province Bar (if there's data)
    if (overallProvinceCounts.total > 0) {
        renderBar('ภาพรวม', overallProvinceCounts, chartContainer, outcomeDisplayOrder, outcomeColorClasses);
    }

    // Render individual hospital bars
    sortedHospitals.forEach(([hospitalName, outcomeCounts]) => {
        renderBar(hospitalName, outcomeCounts, chartContainer, outcomeDisplayOrder, outcomeColorClasses);
    });

    // Render chart legend (call separately to ensure all unique outcomes are collected)
    // Filter outcomeDisplayOrder to only include outcomes actually present in the data for the legend
    const relevantOutcomesForLegend = outcomeDisplayOrder.filter(outcome => allOutcomesPresent.has(outcome));
    renderOutcomeChartLegend(relevantOutcomesForLegend);
}

// Helper function to render a single bar (for hospital or overall) - Reusable for Age Chart
function renderBar(name, segmentCounts, containerElement, displayOrder, colorClasses) {
    const barItem = document.createElement('div');
    barItem.classList.add('bar-item');

    const barLabel = document.createElement('div');
    barLabel.classList.add('bar-label');
    barLabel.textContent = name;
    barItem.appendChild(barLabel);

    const barBody = document.createElement('div');
    barBody.classList.add('bar-body');

    // Add event listeners for custom tooltip to the whole barBody
    barBody.addEventListener('mouseover', (e) => {
        let tooltipText = `<b>${name}</b><br>ยอดรวม: ${segmentCounts.total} ราย<br><br>แบ่งตาม:<br>`;
        displayOrder.forEach(segmentKey => {
            const count = segmentCounts[segmentKey] || 0;
            // Calculate percentage for each segment within the tooltip
            const percentage = segmentCounts.total > 0 ? ((count / segmentCounts.total) * 100).toFixed(1) : 0;

            // Only show segments in tooltip if they have a count > 0 or are a special 'undefined/none' type
            if (count > 0 || segmentKey.includes('ไม่ระบุ') || segmentKey.includes('ไม่มี')) {
                const colorClass = colorClasses[segmentKey];
                tooltipText += `<span class="tooltip-color-dot ${colorClass}"></span> ${segmentKey}: ${count} ราย (${percentage}%)<br>`;
            }
        });
        showTooltip(e, tooltipText);
    });
    barBody.addEventListener('mouseout', hideTooltip);
    barBody.addEventListener('mousemove', (e) => {
        moveTooltip(e);
    });

    // Iterate through the predefined display order
    displayOrder.forEach(segmentKey => {
        const count = segmentCounts[segmentKey] || 0;
        const percentage = segmentCounts.total > 0 ? ((count / segmentCounts.total) * 100).toFixed(1) : 0;

        if (parseFloat(percentage) > 0) { // Only create segment if there's data for it
            const barSegment = document.createElement('div');
            barSegment.classList.add('bar-segment');
            barSegment.classList.add(colorClasses[segmentKey] || 'outcome-Undefined'); // Apply color class
            barSegment.style.width = `${percentage}%`;
            // Display percentage for segments with value > 0
            barSegment.textContent = `${percentage}%`; // MODIFIED LINE - Always show percentage if segment exists
            barBody.appendChild(barSegment);
        }
    });

    barItem.appendChild(barBody);
    containerElement.appendChild(barItem);
}

// Function to show custom tooltip
function showTooltip(event, text) {
    customTooltip.innerHTML = text; // Use innerHTML to allow for HTML in tooltip
    customTooltip.classList.add('show');
    moveTooltip(event);
}

// Function to move custom tooltip
function moveTooltip(event) {
    // Position tooltip relative to mouse cursor
    const xOffset = 15; // Offset from cursor to prevent blocking
    const yOffset = 15;

    // Get boundaries of the chart container to prevent tooltip from going off-screen
    // This needs to be robust, using body or document clientWidth/Height
    const bodyRect = document.body.getBoundingClientRect();
    const tooltipRect = customTooltip.getBoundingClientRect();

    // Add scroll position to clientX/Y
    let newX = event.clientX + window.scrollX + xOffset;
    let newY = event.clientY + window.scrollY + yOffset;

    // Adjust X if tooltip goes off right edge
    if (newX + tooltipRect.width > bodyRect.right - 20) {
        newX = event.clientX + window.scrollX - tooltipRect.width - xOffset;
    }

    // Adjust Y if tooltip goes off bottom edge
    if (newY + tooltipRect.height > bodyRect.bottom - 20) {
        newY = event.clientY + window.scrollY - tooltipRect.height - yOffset;
    }

    // Ensure tooltip doesn't go off the left edge
    if (newX < window.scrollX) {
        newX = window.scrollX;
    }

    // Ensure tooltip doesn't go off the top edge
    if (newY < window.scrollY) {
        newY = window.scrollY;
    }

    customTooltip.style.left = `${newX}px`;
    customTooltip.style.top = `${newY}px`;
}

// Function to hide custom tooltip
function hideTooltip() {
    customTooltip.classList.remove('show');
    customTooltip.innerHTML = ''; // Clear text
}

// Function to render the legend for the stacked bar chart (Outcomes)
function renderOutcomeChartLegend(outcomesToDisplayInLegend) {
    const legendContainer = document.getElementById('outcomeChartLegend');
    legendContainer.innerHTML = ''; // Clear existing legend

    if (outcomesToDisplayInLegend.length === 0) {
        return;
    }

    outcomesToDisplayInLegend.forEach(outcome => {
        const legendItem = document.createElement('div');
        legendItem.classList.add('outcome-legend-item');

        const colorBox = document.createElement('i');
        // Now, outcomeColorClasses[outcome] will refer to classes that have no specific background-color defined by me,
        // allowing the user's CSS to take over or default styles to apply.
        colorBox.classList.add(outcomeColorClasses[outcome] || 'outcome-Undefined'); // Apply class, but colors from user's CSS
        legendItem.appendChild(colorBox);

        const label = document.createElement('span');
        label.textContent = outcome;
        legendItem.appendChild(label);
        legendContainer.appendChild(legendItem);
    });
}

// NEW: Function to render the legend for the gender chart
function renderGenderChartLegend() {
    const legendContainer = document.getElementById('genderChartLegend');
    legendContainer.innerHTML = ''; // Clear existing legend

    genderDisplayOrder.forEach(gender => {
        const legendItem = document.createElement('div');
        legendItem.classList.add('gender-legend-item');

        const colorBox = document.createElement('i');
        colorBox.classList.add(genderColorClasses[gender]); // Apply class, colors from user's CSS
        legendItem.appendChild(colorBox);

        const label = document.createElement('span');
        label.textContent = gender;
        legendItem.appendChild(label);
        legendContainer.appendChild(legendItem);
    });
}

// NEW: Function to render the legend for the risk level chart
function renderRiskLevelChartLegend(levelsToDisplayInLegend) {
    const legendContainer = document.getElementById('riskLevelChartLegend');
    legendContainer.innerHTML = '';
    if (levelsToDisplayInLegend.length === 0) {
        return;
    }
    levelsToDisplayInLegend.forEach(level => {
        const legendItem = document.createElement('div');
        legendItem.classList.add('risk-legend-item'); // Reusing class for styling consistency
        const colorBox = document.createElement('i');
        colorBox.classList.add(riskLevelColorClasses[level]); // Apply class, colors from user's CSS
        legendItem.appendChild(colorBox);
        const label = document.createElement('span');
        label.textContent = level;
        legendItem.appendChild(label);
        legendContainer.appendChild(legendItem);
    });
}

// NEW: Function to determine age group
function getAgeGroup(age) {
    if (age === null || age === undefined || isNaN(age)) return 'ไม่ระบุ/เกิน 100 ปี';
    if (age >= 0 && age <= 4) return '0-4 ปี';
    if (age >= 5 && age <= 9) return '5-9 ปี';
    if (age >= 10 && age <= 14) return '10-14 ปี';
    if (age >= 15 && age <= 24) return '15-24 ปี';
    if (age >= 25 && age <= 34) return '25-34 ปี';
    if (age >= 35 && age <= 44) return '35-44 ปี';
    if (age >= 45 && age <= 54) return '45-54 ปี';
    if (age >= 55 && age <= 64) return '55-64 ปี';
    if (age >= 65 && age <= 100) return '65-100 ปี';
    return 'ไม่ระบุ/เกิน 100 ปี'; // Fallback for ages > 100 or unexpected values
}

// NEW: Function to render Age Chart (Stacked by Gender)
function renderAgeChart(data) {
    const ageChartContainer = document.getElementById('ageChart');
    ageChartContainer.innerHTML = ''; // Clear existing bars

    const ageGroupGenderCounts = {}; // Initialize all age groups with gender counts
    ageGroupOrder.forEach(group => {
        ageGroupGenderCounts[group] = { total: 0 };
        genderDisplayOrder.forEach(gender => {
            ageGroupGenderCounts[group][gender] = 0;
        });
    });

    let totalOverallPatients = 0;

    data.features.forEach(feature => {
        const age = feature.properties['อายุ'];
        const gender = feature.properties['เพศ'] || 'ไม่ระบุเพศ'; // Use 'ไม่ระบุเพศ' if gender is null/undefined
        const ageGroup = getAgeGroup(age);

        if (ageGroupGenderCounts[ageGroup]) { // Ensure ageGroup exists in our predefined order
            ageGroupGenderCounts[ageGroup][gender]++;
            ageGroupGenderCounts[ageGroup].total++;
            totalOverallPatients++;
        }
    });

    if (totalOverallPatients === 0) {
        ageChartContainer.innerHTML = '<p style="text-align: center; color: #777;">ไม่มีข้อมูลช่วงอายุผู้ป่วยตามตัวกรองที่เลือก</p>';
        document.getElementById('genderChartLegend').innerHTML = ''; // Clear legend too
        return;
    }

    // Render the gender legend
    renderGenderChartLegend();

    // Render each age group bar
    ageGroupOrder.forEach(group => {
        const groupData = ageGroupGenderCounts[group];
        // Only render a bar if there's any data for this age group
        if (groupData.total > 0) {
            renderBar(group, groupData, ageChartContainer, genderDisplayOrder, genderColorClasses);
        } else {
            // If no data, render a gray bar with 0%
            const barItem = document.createElement('div');
            barItem.classList.add('bar-item');

            const barLabel = document.createElement('div');
            barLabel.classList.add('bar-label');
            barLabel.textContent = group;
            barItem.appendChild(barLabel);

            const barBody = document.createElement('div');
            barBody.classList.add('bar-body');
            // This will make it gray background
            barBody.textContent = '0 ราย (0.0%)'; // Explicitly show 0%
            barBody.style.justifyContent = 'center'; // Center the text

            // Tooltip for 0 data bars
            barBody.addEventListener('mouseover', (e) => {
                showTooltip(e, `<b>${group}</b>: 0 ราย (0.0%)`);
            });
            barBody.addEventListener('mouseout', hideTooltip);
            barBody.addEventListener('mousemove', (e) => {
                moveTooltip(e);
            });

            barItem.appendChild(barBody);
            ageChartContainer.appendChild(barItem);
        }
    });
}

// NEW: Function to render Risk Chart (Stacked by Risk Level)
function renderRiskChart(data) {
    const riskChartContainer = document.getElementById('riskChart');
    riskChartContainer.innerHTML = ''; // Clear existing bars

    const riskGroupRiskLevelCounts = {};
    const allRiskLevelsPresent = new Set(); // To collect all unique risk levels for the legend

    data.features.forEach(feature => {
        const riskGroup = feature.properties['กลุ่มเสี่ยง'] || 'ไม่ระบุกลุ่มเสี่ยง';
        let riskLevel = feature.properties['ความเสี่ยง'] || 'ไม่ระบุความเสี่ยง'; // Use 'let' to allow modification

        // Check if the riskLevel is explicitly defined in riskLevelDisplayOrder
        // If not, and it belongs to 'ผู้ที่มีโรคหรือภาวะเสี่ยงต่อวัณโรค', map it to 'อื่นๆ'
        if (riskGroup === 'ผู้ที่มีโรคหรือภาภาวะเสี่ยงต่อวัณโรค' &&
            !riskLevelDisplayOrder.includes(riskLevel) &&
            riskLevel !== 'ไม่ระบุความเสี่ยง' // Don't map 'ไม่ระบุความเสี่ยง' to 'อื่นๆ'
        ) {
            riskLevel = 'อื่นๆ'; // Map unknown risk levels within this group to 'อื่นๆ'
        } else if (!riskLevelDisplayOrder.includes(riskLevel) && riskLevel !== 'ไม่ระบุความเสี่ยง') {
            // For other groups, if risk level is not defined, map to 'ไม่ระบุความเสี่ยง' for consistency
            riskLevel = 'ไม่ระบุความเสี่ยง';
        }


        if (!riskGroupRiskLevelCounts[riskGroup]) {
            riskGroupRiskLevelCounts[riskGroup] = { total: 0 };
        }
        if (!riskGroupRiskLevelCounts[riskGroup][riskLevel]) {
            riskGroupRiskLevelCounts[riskGroup][riskLevel] = 0;
        }
        riskGroupRiskLevelCounts[riskGroup][riskLevel]++;
        riskGroupRiskLevelCounts[riskGroup].total++;

        allRiskLevelsPresent.add(riskLevel);
    });

    const sortedRiskGroups = Object.keys(riskGroupRiskLevelCounts).sort((a, b) => {
        // Sort by total count descending, then alphabetically for ties
        const totalA = riskGroupRiskLevelCounts[a].total;
        const totalB = riskGroupRiskLevelCounts[b].total;
        if (totalB !== totalA) {
            return totalB - totalA;
        }
        return a.localeCompare(b);
    });

    if (sortedRiskGroups.length === 0) {
        riskChartContainer.innerHTML = '<p style="text-align: center; color: #777;">ไม่มีข้อมูลกลุ่มเสี่ยงและความเสี่ยงของผู้ป่วยตามตัวกรองที่เลือก</p>';
        document.getElementById('riskLevelChartLegend').innerHTML = '';
        return;
    }

    // Render the risk level legend
    const relevantRiskLevelsForLegend = riskLevelDisplayOrder.filter(level => allRiskLevelsPresent.has(level));
    renderRiskLevelChartLegend(relevantRiskLevelsForLegend);

    // Render each risk group bar
    sortedRiskGroups.forEach(group => {
        const groupData = riskGroupRiskLevelCounts[group];
        renderBar(group, groupData, riskChartContainer, riskLevelDisplayOrder, riskLevelColorClasses);
    });
}

// NEW: Function to render Comorbidity Chart
function renderComorbidityChart(data) {
    const comorbidityChartContainer = document.getElementById('comorbidityChart');
    comorbidityChartContainer.innerHTML = ''; // Clear existing bars

    const classifyComorbidityCounts = {}; // { 'ในปอด (P)': { COPD: count, CKD: count, ... }, 'นอกปอด (EP)': {...} }
    const allComorbidityLevelsPresent = new Set();

    ['ในปอด (P)', 'นอกปอด (EP)', 'ไม่ระบุ'].forEach(classifyType => {
        classifyComorbidityCounts[classifyType] = { total: 0, 'ไม่มีโรคร่วม': 0, 'ไม่ระบุโรคร่วม': 0 };
        comorbidityFields.forEach(field => {
            classifyComorbidityCounts[classifyType][comorbidityDisplayNames[field]] = 0;
        });
    });

    let totalPatientsInChart = 0;

    data.features.forEach(feature => {
        const classify = feature.properties['CLASSIFY'] || 'ไม่ระบุ';
        if (!classifyComorbidityCounts[classify]) {
            // Initialize if a new classify type is found that wasn't predefined
            classifyComorbidityCounts[classify] = { total: 0, 'ไม่มีโรคร่วม': 0, 'ไม่ระบุโรคร่วม': 0 };
            comorbidityFields.forEach(field => {
                classifyComorbidityCounts[classify][comorbidityDisplayNames[field]] = 0;
            });
        }

        classifyComorbidityCounts[classify].total++;
        totalPatientsInChart++;

        let hasAnyComorbidity = false;
        let allComorbidityFieldsUndefined = true;

        comorbidityFields.forEach(field => {
            const comorbidityValue = feature.properties[field];
            if (comorbidityValue !== undefined && comorbidityValue !== null) {
                allComorbidityFieldsUndefined = false;
                if (comorbidityValue === 'Y') {
                    classifyComorbidityCounts[classify][comorbidityDisplayNames[field]]++;
                    allComorbidityLevelsPresent.add(comorbidityDisplayNames[field]);
                    hasAnyComorbidity = true;
                }
            }
        });

        if (!hasAnyComorbidity && !allComorbidityFieldsUndefined) {
            classifyComorbidityCounts[classify]['ไม่มีโรคร่วม']++;
            allComorbidityLevelsPresent.add('ไม่มีโรคร่วม');
        } else if (allComorbidityFieldsUndefined) {
            classifyComorbidityCounts[classify]['ไม่ระบุโรคร่วม']++;
            allComorbidityLevelsPresent.add('ไม่ระบุโรคร่วม');
        }
    });

    // Determine the order for displaying bars (ensure 'ในปอด (P)' and 'นอกปอด (EP)' are first)
    const displayOrderForBars = ['ในปอด (P)', 'นอกปอด (EP)'].filter(type => classifyComorbidityCounts[type] && classifyComorbidityCounts[type].total > 0);
    // Add 'ไม่ระบุ' only if it has data
    if (classifyComorbidityCounts['ไม่ระบุ'] && classifyComorbidityCounts['ไม่ระบุ'].total > 0) {
        displayOrderForBars.push('ไม่ระบุ');
    }

    if (totalPatientsInChart === 0) {
        comorbidityChartContainer.innerHTML = '<p style="text-align: center; color: #777;">ไม่มีข้อมูลโรคร่วมสำหรับผู้ป่วยตามตัวกรองที่เลือก</p>';
        document.getElementById('comorbidityChartLegend').innerHTML = '';
        return;
    }

    // Determine the order for legend items, combining defined fields with 'ไม่มีโรคร่วม' and 'ไม่ระบุโรคร่วม'
    const comorbidityLegendOrder = comorbidityFields.map(field => comorbidityDisplayNames[field])
                                                    .filter(name => allComorbidityLevelsPresent.has(name));
    if (allComorbidityLevelsPresent.has('ไม่มีโรคร่วม')) comorbidityLegendOrder.push('ไม่มีโรคร่วม');
    if (allComorbidityLevelsPresent.has('ไม่ระบุโรคร่วม')) comorbidityLegendOrder.push('ไม่ระบุโรคร่วม');


    // Render the comorbidity legend
    renderComorbidityChartLegend(comorbidityLegendOrder);

    // Render each CLASSIFY group bar
    displayOrderForBars.forEach(classifyType => {
        const groupData = classifyComorbidityCounts[classifyType];
        // Ensure that only relevant comorbidity fields are passed to renderBar for this chart's segments
        // We filter again to ensure segments shown in the bar only exist if their count > 0 for that specific bar,
        // but still include 'ไม่มีโรคร่วม'/'ไม่ระบุโรคร่วม' if they exist.
        const relevantComorbidityDisplayOrder = comorbidityLegendOrder.filter(name => groupData[name] > 0 || name === 'ไม่มีโรคร่วม' || name === 'ไม่ระบุโรคร่วม');
        renderBar(classifyType, groupData, comorbidityChartContainer, relevantComorbidityDisplayOrder, comorbidityColorClasses);
    });
}

// NEW: Function to render the legend for the comorbidity chart
function renderComorbidityChartLegend(comorbiditiesToDisplayInLegend) {
    const legendContainer = document.getElementById('comorbidityChartLegend');
    legendContainer.innerHTML = '';

    comorbiditiesToDisplayInLegend.forEach(comorbidity => {
        const legendItem = document.createElement('div');
        legendItem.classList.add('comorbidity-legend-item');
        const colorBox = document.createElement('i');
        colorBox.classList.add(comorbidityColorClasses[comorbidity]);
        legendItem.appendChild(colorBox);
        const label = document.createElement('span');
        label.textContent = comorbidity;
        legendItem.appendChild(label);
        legendContainer.appendChild(legendItem);
    });
}


// Function for AI Analysis
function performAIAnalysis(data) {
    const analysisDiv = document.getElementById('analysisParagraphs');
    analysisDiv.innerHTML = 'กำลังประมวลผลการวิเคราะห์...';

    if (!data || !data.features || data.features.length === 0) {
        analysisDiv.innerHTML = '<p>ไม่พบข้อมูลผู้ป่วยสำหรับวิเคราะห์.</p>';
        return;
    }

    const totalPatients = data.features.length;
    let analysisHtml = '';

    // --- 1. ภาพรวมข้อมูลผู้ป่วย ---
    const outcomeCounts = {};
    outcomeDisplayOrder.forEach(outcome => outcomeCounts[outcome] = 0); 

    data.features.forEach(f => {
        const outcome = f.properties['ผลการรักษา'] || 'ไม่ระบุ';
        if (outcomeCounts.hasOwnProperty(outcome) || outcome === 'ไม่ระบุ') {
            outcomeCounts[outcome]++;
        } else {
            outcomeCounts[outcome] = (outcomeCounts[outcome] || 0) + 1; 
        }
    });

    const completedCount = outcomeCounts['Completed'] || 0;
    const curedCount = outcomeCounts['Cured'] || 0;
    const onTreatmentCount = outcomeCounts['On treatment'] || 0;
    const transferredOutCount = outcomeCounts['Transferred out'] || 0;
    const diedCount = outcomeCounts['Died'] || 0;
    const lostToFollowUpCount = outcomeCounts['Lost to follow-up'] || 0;
    const failedCount = outcomeCounts['Failed'] || 0;
    const rrmdrCount = outcomeCounts['RR/MDR ก่อนเดือนที่ 5'] || 0;
    const changeDiagnosisCount = outcomeCounts['Change diagnosis'] || 0;
    const undefinedOutcomeCount = outcomeCounts['ไม่ระบุ'] || 0;

    const successCount = completedCount + curedCount;
    const successRate = totalPatients > 0 ? ((successCount / totalPatients) * 100).toFixed(1) : 0;

    analysisHtml += `
        <h4>ภาพรวมข้อมูลผู้ป่วย</h4>
        <p>ข้อมูลผู้ป่วยวัณโรคจำนวน <b>${totalPatients} ราย</b> (ตามตัวกรองปัจจุบัน) แสดงผลการรักษาดังนี้:</p>
        <ul>
            <li>รักษาหาย (Cured): <b>${curedCount} ราย</b> (${totalPatients > 0 ? ((curedCount / totalPatients) * 100).toFixed(1) : 0}%)</li>
            <li>รักษาครบ (Completed): <b>${completedCount} ราย</b> (${totalPatients > 0 ? ((completedCount / totalPatients) * 100).toFixed(1) : 0}%)</li>
            <li>ยังอยู่ระหว่างรักษา (On treatment): <b>${onTreatmentCount} ราย</b> (${totalPatients > 0 ? ((onTreatmentCount / totalPatients) * 100).toFixed(1) : 0}%)</li>
            <li>เปลี่ยนการวินิจฉัย: <b>${changeDiagnosisCount} ราย</b> (${totalPatients > 0 ? ((changeDiagnosisCount / totalPatients) * 100).toFixed(1) : 0}%)</li>
            <li>RR/MDR ก่อนเดือนที่ 5: <b>${rrmdrCount} ราย</b> (${totalPatients > 0 ? ((rrmdrCount / totalPatients) * 100).toFixed(1) : 0}%)</li>
            <li>ย้ายออก: <b>${transferredOutCount} ราย</b> (${totalPatients > 0 ? ((transferredOutCount / totalPatients) * 100).toFixed(1) : 0}%)</li>
            <li>ขาดการรักษา (Lost to follow-up): <b>${lostToFollowUpCount} ราย</b> (${totalPatients > 0 ? ((lostToFollowUpCount / totalPatients) * 100).toFixed(1) : 0}%)</li>
            <li>เสียชีวิต: <b>${diedCount} ราย</b> (${totalPatients > 0 ? ((diedCount / totalPatients) * 100).toFixed(1) : 0}%)</li>
            ${failedCount > 0 ? `<li>Failed: <b>${failedCount} ราย</b> (${totalPatients > 0 ? ((failedCount / totalPatients) * 100).toFixed(1) : 0}%)</li>` : ''}
            ${undefinedOutcomeCount > 0 ? `<li>ไม่ระบุ: <b>${undefinedOutcomeCount} ราย</b> (${totalPatients > 0 ? ((undefinedOutcomeCount / totalPatients) * 100).toFixed(1) : 0}%)</li>` : ''}
        </ul>
        <p>โดยรวมแล้ว อัตราความสำเร็จของการรักษา (หาย + ครบ) อยู่ที่ <b>${successRate}%</b></p>
    `;

    // --- 2. ผลงานของโรงพยาบาล ---
    const hospitalPerformance = {}; 

    data.features.forEach(f => {
        const hospital = f.properties['โรงพยาบาล'] || 'ไม่ระบุโรงพยาบาล';
        const outcome = f.properties['ผลการรักษา'] || 'ไม่ระบุ';

        if (!hospitalPerformance[hospital]) {
            hospitalPerformance[hospital] = { total: 0, cured: 0, completed: 0, lost: 0, died: 0 };
        }
        hospitalPerformance[hospital].total++;
        if (outcome === 'Cured') hospitalPerformance[hospital].cured++;
        if (outcome === 'Completed') hospitalPerformance[hospital].completed++;
        if (outcome === 'Lost to follow-up') hospitalPerformance[hospital].lost++;
        if (outcome === 'Died') hospitalPerformance[hospital].died++;
    });

    Object.keys(hospitalPerformance).forEach(h => {
        const hp = hospitalPerformance[h];
        hp.successRate = hp.total > 0 ? (((hp.cured + hp.completed) / hp.total) * 100) : 0;
        hp.diedRate = hp.total > 0 ? ((hp.died / hp.total) * 100) : 0; 
    });

    const sortedHospitalsBySuccess = Object.entries(hospitalPerformance)
        .sort(([, a], [, b]) => b.successRate - a.successRate); 

    const top3Hospitals = sortedHospitalsBySuccess.slice(0, 3);
    let top3HospitalsText = top3Hospitals.map(([name, perf]) =>
        `${name} (สำเร็จ ${perf.successRate.toFixed(1)}%)`
    ).join(', ');

    const challengingHospitals = Object.entries(hospitalPerformance)
        .filter(([, h]) => h.diedRate > 0) 
        .sort(([, a], [, b]) => b.diedRate - a.diedRate) 
        .slice(0, 2); 

    let challengingHospitalsText = challengingHospitals.length > 0
        ? challengingHospitals.map(([name, perf]) => `${name} (เสียชีวิต ${perf.diedRate.toFixed(1)}%)`).join(', ')
        : 'ไม่พบโรงพยาบาลที่มีสัดส่วนผู้ป่วยเสียชีวิตสูงเป็นพิเศษ';


    analysisHtml += `
        <h4>ผลงานของโรงพยาบาล</h4>
        <p>โรงพยาบาลที่มีอัตราความสำเร็จสูง 3 อันดับแรกคือ: <b>${top3HospitalsText}</b>. โรงพยาบาลเหล่านี้ทำผลงานได้ดี ควรนำไปเป็นตัวอย่าง.</p>
        <p>ส่วนโรงพยาบาลที่ยังมีความท้าทาย โดยมีสัดส่วนผู้ป่วยเสียชีวิตสูง ได้แก่ <b>${challengingHospitalsText}</b>. โรงพยาบาลเหล่านี้ต้องพิจารณาหาสาเหตุและปรับปรุงการดูแลผู้ป่วย.</p>
        <p>สามารถดูรายละเอียดผลงานของแต่ละโรงพยาบาลได้จากกราฟแท่งด้านบน.</p>
    `;

    // --- 3. การวิเคราะห์ตามช่วงอายุและเพศ ---
    const ageGroupCounts = {};
    const genderCounts = {};
    let mostCommonAgeGroup = 'ไม่ระบุ';
    let maxAgeGroupCount = 0;
    let mostCommonGender = 'ไม่ระบุเพศ';
    let maxGenderCount = 0;

    data.features.forEach(f => {
        const ageGroup = getAgeGroup(f.properties['อายุ']);
        const gender = f.properties['เพศ'] || 'ไม่ระบุเพศ';

        ageGroupCounts[ageGroup] = (ageGroupCounts[ageGroup] || 0) + 1;
        genderCounts[gender] = (genderCounts[gender] || 0) + 1;

        if (ageGroupCounts[ageGroup] > maxAgeGroupCount) {
            maxAgeGroupCount = ageGroupCounts[ageGroup];
            mostCommonAgeGroup = ageGroup;
        }
        if (genderCounts[gender] > maxGenderCount) {
            maxGenderCount = genderCounts[gender];
            mostCommonGender = gender;
        }
    });

    const sortedAgeGroups = Object.entries(ageGroupCounts).sort(([, a], [, b]) => b - a);
    let secondMostCommonAgeGroupText = '';
    if (sortedAgeGroups.length > 1) {
        secondMostCommonAgeGroupText = `และ, รองลงมาคือกลุ่ม <b>${sortedAgeGroups[1][0]}</b> (${sortedAgeGroups[1][1]} ราย (${totalPatients > 0 ? ((sortedAgeGroups[1][1] / totalPatients) * 100).toFixed(1) : 0}%)).`;
    }

    const mostCommonGenderCount = genderCounts[mostCommonGender] || 0;
    const mostCommonGenderPercentage = totalPatients > 0 ? ((mostCommonGenderCount / totalPatients) * 100).toFixed(1) : 0;
    const mostCommonAgeGroupPercentage = totalPatients > 0 ? ((maxAgeGroupCount / totalPatients) * 100).toFixed(1) : 0;


    analysisHtml += `
        <h4>การวิเคราะห์ตามช่วงอายุและเพศ</h4>
        <p>กราฟแสดงให้เห็นส่วนใหญ่เป็นเพศ <b>${mostCommonGender}</b> (${mostCommonGenderCount} ราย (${mostCommonGenderPercentage}%)) และเมื่อดูตามกลุ่มอายุพบว่า ผู้ป่วยวัณโรคส่วนใหญ่อยู่ในกลุ่มอายุ <b>${mostCommonAgeGroup}</b> (${maxAgeGroupCount} ราย (${mostCommonAgeGroupPercentage}%)) ${secondMostCommonAgeGroupText} ข้อมูลนี้เป็นประโยชน์ในการวางแผนการเฝ้าระวังและเข้าถึงกลุ่มเป้าหมายในแต่ละช่วงวัยและเพศ.</p>
    `;

    // --- 4. การวิเคราะห์ตามกลุ่มเสี่ยงและความเสี่ยง ---
    const riskGroupRiskLevelCounts = {}; 

    data.features.forEach(f => {
        const riskGroup = f.properties['กลุ่มเสี่ยงหลัก'] || 'ไม่มีกลุ่มเสี่ยง';
        const riskLevel = f.properties['ความเสี่ยง'] || 'ไม่ระบุความเสี่ยง';

        if (!riskGroupRiskLevelCounts[riskGroup]) {
            riskGroupRiskLevelCounts[riskGroup] = { total: 0 };
        }
        if (!riskGroupRiskLevelCounts[riskGroup][riskLevel]) {
            riskGroupRiskLevelCounts[riskGroup][riskLevel] = 0;
        }
        riskGroupRiskLevelCounts[riskGroup][riskLevel]++;
        riskGroupRiskLevelCounts[riskGroup].total++;
    });

    const sortedRiskGroupsForAnalysis = Object.entries(riskGroupRiskLevelCounts)
        .sort(([, a], [, b]) => b.total - a.total);

    let topRiskGroupText = '';
    let topRiskLevelsInGroupText = '';

    if (sortedRiskGroupsForAnalysis.length > 0) {
        const [topRiskGroupName, topRiskGroupData] = sortedRiskGroupsForAnalysis[0];
        const topRiskGroupPercentage = totalPatients > 0 ? ((topRiskGroupData.total / totalPatients) * 100).toFixed(1) : 0;
        topRiskGroupText = `<b>${topRiskGroupName}</b> มีจำนวนผู้ป่วยมากที่สุด (${topRiskGroupData.total} ราย (${topRiskGroupPercentage}%)).`;

        const sortedRiskLevelsInTopGroup = Object.entries(topRiskGroupData)
            .filter(([key,]) => key !== 'total')
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3); 

        if (sortedRiskLevelsInTopGroup.length > 0) {
            topRiskLevelsInGroupText += `โดยมีความเสี่ยงย่อยที่เด่นชัดคือ `;
            sortedRiskLevelsInTopGroup.forEach(([name, count], index) => {
                const percentage = totalPatients > 0 ? ((count / totalPatients) * 100).toFixed(1) : 0;
                if (index === 0) {
                    topRiskLevelsInGroupText += `<b>${name}</b> (${count} ราย (${percentage}%))`;
                } else if (index === 1) {
                    topRiskLevelsInGroupText += `, อันดับ 2 คือ <b>${name}</b> (${count} ราย (${percentage}%))`;
                } else if (index === 2) {
                    topRiskLevelsInGroupText += `, และอันดับ 3 คือ <b>${name}</b> (${count} ราย (${percentage}%))`;
                }
            });
            topRiskLevelsInGroupText += `.`;
        }

        analysisHtml += `
            <h4>การวิเคราะห์ตามกลุ่มเสี่ยงและความเสี่ยง</h4>
            <p>จากการวิเคราะห์กลุ่มเสี่ยงหลักพบว่า ${topRiskGroupText} ${topRiskLevelsInGroupText} การทำความเข้าใจกลุ่มเสี่ยงเหล่านี้จะช่วยให้สามารถดำเนินมาตรการป้องกันและคัดกรองได้อย่างตรงจุดและมีประสิทธิภาพยิ่งขึ้น.</p>
        `;
    } else {
        analysisHtml += `<h4>การวิเคราะห์ตามกลุ่มเสี่ยงและความเสี่ยง</h4><p>ไม่พบข้อมูลกลุ่มเสี่ยงและความเสี่ยงของผู้ป่วย.</p>`;
    }

    // --- 5. การวิเคราะห์จำนวนผู้ป่วยแยกตามโรคร่วม (Comorbidity) ---
    const comorbidityDetailedCounts = {};
    const relevantComorbidities = ['COPD', 'CKD', 'DM', 'HT', 'ไม่มีโรคร่วม']; // Specific comorbidities to analyze

    data.features.forEach(f => {
        const comorbidities = (f.properties['โรคร่วม'] || 'ไม่มีโรคร่วม').split(',').map(c => c.trim());
        const diseaseSite = f.properties['ตำแหน่งการเกิดโรค'] || 'ไม่ระบุตำแหน่ง'; 

        comorbidities.forEach(comorbidity => {
            if (comorbidity === '') return; 

            if (comorbidity === 'ไม่มีโรคร่วม' && comorbidities.length > 1) {
                return; 
            }

            if (!comorbidityDetailedCounts[comorbidity]) {
                comorbidityDetailedCounts[comorbidity] = { 'ในปอด': 0, 'นอกปอด': 0, 'ไม่ระบุตำแหน่ง': 0, 'total': 0 };
            }

            if (diseaseSite === 'ในปอด') {
                comorbidityDetailedCounts[comorbidity]['ในปอด']++;
            } else if (diseaseSite === 'นอกปอด') {
                comorbidityDetailedCounts[comorbidity]['นอกปอด']++;
            } else {
                comorbidityDetailedCounts[comorbidity]['ไม่ระบุตำแหน่ง']++;
            }
            comorbidityDetailedCounts[comorbidity]['total']++;
        });
    });

    const sortedComorbidityDetailed = Object.entries(comorbidityDetailedCounts)
        .sort(([, a], [, b]) => b.total - a.total);

    analysisHtml += `<h4>การวิเคราะห์จำนวนผู้ป่วยแยกตามโรคร่วม</h4>`;
    if (sortedComorbidityDetailed.length > 0) {
        analysisHtml += `<p>จากการวิเคราะห์ข้อมูลโรคร่วมและตำแหน่งการเกิดโรค พบว่า:</p><ul>`;
        
        sortedComorbidityDetailed.forEach(([comorbidity, counts]) => {
            const comorbidityPercentage = totalPatients > 0 ? ((counts.total / totalPatients) * 100).toFixed(1) : 0;
            
            analysisHtml += `<li><b>${comorbidity}</b>: ${counts.total} ราย (${comorbidityPercentage}%)`;
            
            let siteDetails = [];
            if (counts['ในปอด'] > 0) {
                siteDetails.push(`ในปอด (P) ${counts['ในปอด']} ราย`); // Added (P)
            }
            if (counts['นอกปอด'] > 0) {
                siteDetails.push(`นอกปอด (EP) ${counts['นอกปอด']} ราย`); // Added (EP)
            }
            if (counts['ไม่ระบุตำแหน่ง'] > 0) {
                 siteDetails.push(`ไม่ระบุตำแหน่ง ${counts['ไม่ระบุตำแหน่ง']} ราย`);
            }

            if (siteDetails.length > 0) {
                analysisHtml += ` (แบ่งเป็น: ${siteDetails.join(', ')})`;
            }
            analysisHtml += `</li>`;
        });
        analysisHtml += `</ul><p>ข้อมูลโรคร่วมและตำแหน่งการเกิดโรคนี้มีความสำคัญในการวางแผนการรักษาและการดูแลผู้ป่วยแบบองค์รวม โดยเฉพาะในกลุ่มผู้ป่วยที่มีโรคร่วมหลายโรค.</p>`;
    } else {
        analysisHtml += `<p>ไม่พบข้อมูลโรคร่วมของผู้ป่วย.</p>`;
    }


    // --- 6. การเฝ้าระวังผู้ป่วยดื้อยา (RR/MDR) ---
    const rrmdrPatients = data.features.filter(f => f.properties['ผลการรักษา'] === 'RR/MDR ก่อนเดือนที่ 5');
    const rrmdrTotal = rrmdrPatients.length;

    let rrmdrAnalysis = `<h4>การเฝ้าระวังผู้ป่วยดื้อยา (RR/MDR)</h4>`;
    if (rrmdrTotal > 0) {
        const rrmdrPatientsByLocation = {}; 
        rrmdrPatients.forEach(f => {
            const location = `${f.properties['อำเภอ']} - ${f.properties['ตำบล']}`;
            rrmdrPatientsByLocation[location] = (rrmdrPatientsByLocation[location] || 0) + 1;
        });

        const sortedRrmdrLocations = Object.entries(rrmdrPatientsByLocation).sort((a, b) => b[1] - a[1]);

        rrmdrAnalysis += `<p>พบผู้ป่วยที่วินิจฉัยว่าเป็นวัณโรคดื้อยา (RR/MDR) จำนวน <b>${rrmdrTotal} ราย</b> ในพื้นที่ดังต่อไปนี้ (เรียงตามจำนวนมากไปน้อย):</p><ul>`;
        sortedRrmdrLocations.forEach(([location, count]) => {
            rrmdrAnalysis += `<li><b>${location}</b>: ${count} ราย</li>`;
        });
        rrmdrAnalysis += `</ul><p>การเฝ้าระวังและติดตามผู้ป่วยในพื้นที่เหล่านี้อย่างใกล้ชิดมีความสำคัญอย่างยิ่ง เพื่อป้องกันการแพร่กระจายของเชื้อดื้อยาและควบคุมสถานการณ์ในระยะยาว.</p>`;
    } else {
        rrmdrAnalysis += `<p>ไม่พบข้อมูลผู้ป่วยวัณโรคดื้อยา (RR/MDR) ในข้อมูลที่เลือก.</p>`;
    }
    analysisHtml += rrmdrAnalysis;


    // --- 7. ข้อสังเกตและคำแนะนำ ---
    const targetSuccessRate = 80; // Example target
    const currentSuccessRate = parseFloat(successRate);
    const diedPatientsCount = outcomeCounts['Died'] || 0;
    const lostToFollowUpPatientsCount = outcomeCounts['Lost to follow-up'] || 0;

    analysisHtml += `<h4>ข้อสังเกตและคำแนะนำ</h4><ul>`;

    if (currentSuccessRate < targetSuccessRate) {
        analysisHtml += `<li><b>ต้องปรับปรุงอัตราสำเร็จ:</b> อัตราความสำเร็จโดยรวม (${currentSuccessRate}%) ยังไม่ถึงเป้าหมาย (${targetSuccessRate}%) ควรทบทวนขั้นตอนการรักษาและหาทางเพิ่มประสิทธิภาพ.</li>`;
    } else {
        analysisHtml += `<li><b>อัตราความสำเร็จที่ดี:</b> อัตราความสำเร็จโดยรวม (${currentSuccessRate}%) อยู่ในระดับที่ดี แต่ยังสามารถพัฒนาต่อไปได้.</li>`;
    }

    if (diedPatientsCount > 0 && (diedPatientsCount / totalPatients) * 100 > 5) { 
        analysisHtml += `<li><b>อัตราเสียชีวิตสูง:</b> เพื่อวิเคราะห์และระบุว่าผู้ป่วยมีอาการหนักหรือไม่ ผู้ป่วยวัณโรคเสียชีวิตค่อนข้างมาก (${diedPatientsCount} ราย). ควรตรวจสอบว่ามีสาเหตุใดที่สามารถป้องกันได้ และปรับปรุงการดูแลผู้ป่วยกลุ่มที่มีอาการหนักหรือมีโรคประจำตัว.</li>`;
    } else if (diedPatientsCount > 0) {
        analysisHtml += `<li><b>มีผู้ป่วยเสียชีวิต:</b> พบผู้ป่วยเสียชีวิตจำนวนหนึ่ง (${diedPatientsCount} ราย). ควรมีการทบทวนรายกรณีเพื่อทำความเข้าใจสาเหตุและแนวทางป้องกัน.</li>`;
    } else {
        analysisHtml += `<li><b>ไม่พบผู้ป่วยเสียชีวิต:</b> ในข้อมูลที่เลือก ไม่พบผู้ป่วยเสียชีวิต ซึ่งเป็นสัญญาณที่ดี.</li>`;
    }

    if (lostToFollowUpPatientsCount > 0 && (lostToFollowUpPatientsCount / totalPatients) * 100 > 1) { 
        analysisHtml += `<li><b>การติดตามผู้ป่วย:</b> มีผู้ป่วยขาดการรักษา (${lostToFollowUpPatientsCount} ราย). ควรปรับปรุงระบบการติดตามและสร้างแรงจูงใจให้ผู้ป่วยรักษาต่อเนื่องจนครบ.</li>`;
    } else {
        analysisHtml += `<li><b>การติดตามผู้ป่วยมีประสิทธิภาพ:</b> มีผู้ป่วยขาดการรักษาจำนวนน้อย (${lostToFollowUpPatientsCount} ราย) แสดงว่าระบบการติดตามค่อนข้างมีประสิทธิภาพ.</li>`;
    }

    analysisHtml += `<li>การปรับปรุงจุดที่พบปัญหาจะช่วยให้การควบคุมวัณโรคในจังหวัดนครสวรรค์ดีขึ้นได้.</li></ul>`;

    analysisDiv.innerHTML = analysisHtml;
}















// ฟังก์ชันหลักในการกรองและแสดงผลข้อมูล
async function applyFilters() {
    if (!rawGeojsonData) {
        console.warn("rawGeojsonData ยังไม่พร้อมใช้งาน");
        return;
    }

    const selectedDistrict = document.getElementById('district-filter').value;
    const selectedOutcome = document.getElementById('outcome-filter').value;
    const selectedHospital = document.getElementById('hospital-filter').value;


    let filteredFeatures = rawGeojsonData.features;

    if (selectedDistrict !== 'ทั้งหมด') {
        filteredFeatures = filteredFeatures.filter(feature =>
            feature.properties['อำเภอ'] === selectedDistrict
        );
    }

    if (selectedOutcome !== 'ทั้งหมด') {
        filteredFeatures = filteredFeatures.filter(feature =>
            (feature.properties['ผลการรักษา'] || 'ไม่ระบุ') === selectedOutcome
        );
    }

    if (selectedHospital !== 'ทั้งหมด') {
        filteredFeatures = filteredFeatures.filter(feature =>
            (feature.properties['โรงพยาบาล'] || 'ไม่ระบุ') === selectedHospital
        );
    }

    const filteredGeojsonData = {
        "type": "FeatureCollection",
        "features": filteredFeatures
    };

    // Aggregate data for map display based on filtered data
    const aggregatedDataForMap = aggregateData(filteredGeojsonData);

    // Update map layer
    if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
    }
    geoJsonLayer = L.geoJson(aggregatedDataForMap, {
        style: function (feature) {
            const count = selectedOutcome === 'ทั้งหมด' ?
                feature.properties.total_count :
                (feature.properties.outcome_counts[selectedOutcome] || 0);
            return {
                fillColor: getColorForCount(count),
                weight: 2,
                opacity: 1,
                color: 'white',
                dashArray: '',
                fillOpacity: 0.7
            };
        },
        onEachFeature: onEachFeature
    }).addTo(map);

    // Fit map bounds to the new layer (optional, can be too zoomed for single points)
    if (geoJsonLayer.getBounds().isValid()) {
        map.fitBounds(geoJsonLayer.getBounds());
    } else {
        // Fallback to initial view if no valid bounds (e.g., all filtered out)
        map.setView([13.7563, 100.5018], 6);
    }

    // Update legend based on currently selected outcome
    updateLegend(selectedOutcome);

    // Update labels on map
    addLabelsToMap(aggregatedDataForMap, selectedOutcome);

    // Render charts with the filtered raw data (not aggregated for map)
    renderStaticHospitalChart(filteredGeojsonData);
    renderAgeChart(filteredGeojsonData); // Pass raw data
    renderRiskChart(filteredGeojsonData); // Pass raw data
    renderComorbidityChart(filteredGeojsonData); // NEW: Render Comorbidity Chart

    // Perform AI Analysis on the filtered data
    performAIAnalysis(filteredGeojsonData);
}


// Initial data load and setup
loadAndCombineGeoJSON().then(data => {
    if (data) {
        rawGeojsonData = data; // Store original raw data
        const districts = [...new Set(data.features.map(f => f.properties['อำเภอ']))].sort();
        const outcomes = [...new Set(data.features.map(f => f.properties['ผลการรักษา'] || 'ไม่ระบุ'))].sort((a, b) => {
            // Custom sort to put 'ไม่ระบุ' at the end
            if (a === 'ไม่ระบุ') return 1;
            if (b === 'ไม่ระบุ') return -1;
            return a.localeCompare(b);
        });
        const hospitals = [...new Set(data.features.map(f => f.properties['โรงพยาบาล'] || 'ไม่ระบุ'))].sort();


        createDistrictFilter(districts);
        createOutcomeFilter(outcomes);
        createHospitalFilter(hospitals); // NEW: Create hospital filter

        applyFilters(); // Apply filters initially to render all
    } else {
        console.error("ไม่สามารถโหลดข้อมูล GeoJSON ได้");
    }
});