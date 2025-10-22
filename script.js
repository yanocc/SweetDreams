// Add this helper function at the top of your script.js file
function formatTimeTo12Hour(time24) {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight, 13-23 to 1-11
    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.getElementById(pageId).scrollTop = 0;
}

const orderItems = { 
  brookie: 0, 
  ubeCoconut: 0,
  ubeCheese: 0
};

function changeQty(item, change) {
    orderItems[item] = Math.max(0, orderItems[item] + change);
    document.getElementById('qty-' + item).textContent = orderItems[item];
    const itemElement = document.querySelector('[data-item="' + item + '"]');
    if (orderItems[item] > 0) {
        itemElement.classList.add('selected');
    } else {
        itemElement.classList.remove('selected');
    }
}

const pickupRadio = document.getElementById('pickup');
const deliveryRadio = document.getElementById('delivery');
const addressGroup = document.getElementById('addressGroup');
const addressField = document.getElementById('address');

function toggleAddressField() {
    if (deliveryRadio.checked) {
        addressGroup.style.display = 'block';
        addressField.required = true;
    } else {
        addressGroup.style.display = 'none';
        addressField.required = false;
    }
}

pickupRadio.addEventListener('change', function() {
    toggleAddressField();
    document.getElementById('date').value = '';
    document.getElementById('timeSlotGroup').style.display = 'none';
    selectedTimeSlot = null;
    deliveryFee = 0;
    deliveryArea = '';
});

deliveryRadio.addEventListener('change', function() {
    toggleAddressField();
    document.getElementById('date').value = '';
    document.getElementById('timeSlotGroup').style.display = 'none';
    selectedTimeSlot = null;
    deliveryFee = 0;
    deliveryArea = '';
});

let bookedSlots = {};
let selectedTimeSlot = null;
let deliveryFee = 0;
let deliveryArea = '';

// Fetch booked slots from Google Sheets on page load
async function fetchBookedSlots() {
    try {
        const response = await fetch(SCRIPT_URL + '?fetch=booked&callback=handleBookedSlots');
        const text = await response.text();
        // Extract JSON from JSONP response
        const jsonMatch = text.match(/handleBookedSlots\((.*)\)/);
        if (jsonMatch && jsonMatch[1]) {
            bookedSlots = JSON.parse(jsonMatch[1]);
            console.log('Fetched booked slots:', bookedSlots);
        }
    } catch (error) {
        console.error('Error fetching booked slots:', error);
        bookedSlots = {};
    }
}

function handleBookedSlots(data) {
    bookedSlots = data;
    console.log('Booked slots loaded:', bookedSlots);
}

const scheduleConfig = {
    pickup: {
        days: [2, 4],
        startTime: 14.5,  // 2:30 PM
        endTime: 16.75,   // 4:45 PM
        duration: 15,
        label: 'Pick-up'
    },
    delivery: {
        saturday: {
            day: 6,
            startTime: 14.5,  // 2:30 PM
            endTime: 17.5,    // 5:30 PM
            duration: 30,
            area: 'Eau Claire',
            fee: 6.50
        },
        sunday: {
            day: 0,
            startTime: 14.5,  // 2:30 PM
            endTime: 17,      // 5:00 PM
            duration: 30,
            area: 'Mondovi',
            fee: 2
        }
    }
};

function generateTimeSlots(startTime, endTime, durationMinutes) {
    const slots = [];
    let current = startTime;
    const durationHours = durationMinutes / 60;
    
    while (current + durationHours <= endTime) {
        const hours = Math.floor(current);
        const minutes = Math.round((current - hours) * 60);
        const timeString = String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
        const formatted12Hour = formatTimeTo12Hour(timeString);
        slots.push(formatted12Hour);
        current += durationHours;
    }
    
    return slots;
}

function loadTimeSlots() {
    const dateInput = document.getElementById('date');
    const selectedDate = dateInput.value;
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked');
    
    if (!selectedDate) {
        document.getElementById('timeSlotGroup').style.display = 'none';
        return;
    }
    
    if (!deliveryMethod) {
        document.getElementById('timeSlotGroup').style.display = 'none';
        alert('Please select a delivery method first (Pick-up or Delivery)');
        return;
    }
    
    const date = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = date.getDay();
    
    const selectorDiv = document.getElementById('timeSlotSelector');
    selectorDiv.innerHTML = '';
    
    const existingInfo = selectorDiv.parentElement.querySelector('.schedule-info');
    if (existingInfo) {
        existingInfo.remove();
    }
    
    selectedTimeSlot = null;
    deliveryFee = 0;
    deliveryArea = '';
    
    let availableSlots = [];
    let dayLabel = '';
    
    if (deliveryMethod.value === 'pickup') {
        if (scheduleConfig.pickup.days.includes(dayOfWeek)) {
            availableSlots = generateTimeSlots(
                scheduleConfig.pickup.startTime,
                scheduleConfig.pickup.endTime,
                scheduleConfig.pickup.duration
            );
            dayLabel = scheduleConfig.pickup.label;
        } else {
            document.getElementById('timeSlotGroup').style.display = 'block';
            selectorDiv.innerHTML = '<p style="color: #ff6b6b; padding: 15px; text-align: center;">Pick-up is only available on Tuesdays and Thursdays (2:30 PM - 4:30 PM). Please select a different date.</p>';
            return;
        }
    } else if (deliveryMethod.value === 'delivery') {
        if (dayOfWeek === scheduleConfig.delivery.saturday.day) {
            availableSlots = generateTimeSlots(
                scheduleConfig.delivery.saturday.startTime,
                scheduleConfig.delivery.saturday.endTime,
                scheduleConfig.delivery.saturday.duration
            );
            deliveryArea = scheduleConfig.delivery.saturday.area;
            deliveryFee = scheduleConfig.delivery.saturday.fee;
            dayLabel = 'Delivery - ' + deliveryArea + ' Area (+ $' + deliveryFee.toFixed(2) + ')';

function selectTimeSlot(time, element, date) {
    document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));
    element.classList.add('selected');
    selectedTimeSlot = time;
    document.getElementById('timeError').style.display = 'none';
}

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxKSjTlLvY0oZp9RhqwLa8W6c-YRN5Ql1M-UUPlMYEf1pAIn7UlgqntMfSxdEJQhfEFdQ/exec';

function showLoadingVideo() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loadingOverlay';
    loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(34, 34, 41, 0.95);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 4000;
        gap: 80px;
    `;

    const planet = document.createElement('div');
    planet.className = 'planet-loader';
    planet.style.cssText = `
        display: block;
        width: 125px;
        height: 125px;
        position: relative;
        transform-style: preserve-3d;
        border-radius: 50%;
        background: linear-gradient(
          180deg,
          rgba(252, 201, 107, 1) 0%,
          rgba(252, 201, 107, 1) 15%,
          rgba(247, 174, 1, 1) 15%,
          rgba(247, 174, 1, 1) 19%,
          rgba(252, 201, 107, 1) 19%,
          rgba(252, 201, 107, 1) 22%,
          rgba(247, 174, 1, 1) 22%,
          rgba(247, 174, 1, 1) 28%,
          rgba(252, 201, 107, 1) 28%,
          rgba(252, 201, 107, 1) 31%,
          rgba(252, 201, 107, 1) 33%,
          rgba(252, 201, 107, 1) 36%,
          rgba(247, 174, 1, 1) 36%,
          rgba(247, 174, 1, 1) 48%,
          rgba(252, 201, 107, 1) 48%,
          rgba(252, 201, 107, 1) 55%,
          rgba(247, 174, 1, 1) 55%,
          rgba(247, 174, 1, 1) 66%,
          rgba(252, 201, 107, 1) 66%,
          rgba(252, 201, 107, 1) 70%,
          rgba(247, 174, 1, 1) 70%,
          rgba(247, 174, 1, 1) 73%,
          rgba(252, 201, 107, 1) 73%,
          rgba(252, 201, 107, 1) 82%,
          rgba(247, 174, 1, 1) 82%,
          rgba(247, 174, 1, 1) 86%,
          rgba(252, 201, 107, 1) 86%
        );
        box-shadow: inset 0 0 25px rgba(0, 0, 0, 0.25),
          inset 8px -4px 6px rgba(199, 128, 0, 0.5),
          inset -8px 4px 8px rgba(255, 235, 199, 0.5),
          inset 20px -5px 12px #f7ae01,
          0 0 100px rgba(255, 255, 255, 0.35);
        transform: rotateZ(-15deg);
    `;

    const planetBefore = document.createElement('div');
    planetBefore.style.cssText = `
        position: absolute;
        content: "";
        display: block;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        border: 16px solid #7b6f42;
        border-top-width: 0;
        border-radius: 50%;
        box-shadow: 0 -2px 0 #b1a693;
        animation: rings1 0.8s infinite linear;
        top: 0;
        left: 0;
    `;

    const planetAfter = document.createElement('div');
    planetAfter.style.cssText = `
        position: absolute;
        content: "";
        display: block;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        border: 8px solid #b1a693;
        border-top-width: 0;
        border-radius: 50%;
        box-shadow: 0 -2px 0 #7b6f42;
        animation: rings2 0.8s infinite linear;
        top: 0;
        left: 0;
    `;

    planet.appendChild(planetBefore);
    planet.appendChild(planetAfter);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '114.551 81.194 134.814 113.214');
    svg.style.cssText = `
        z-index: 1;
        width: 50vw;
        max-width: 40rem;
        height: auto;
    `;

    const sparklesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    sparklesGroup.setAttribute('class', 'sparkles-loader');

    const sparklesData = [
        { d: 'M 143.21 131.761 C 143.21 131.761 144.398 125.559 145.453 131.761 C 145.453 131.761 151.391 132.816 145.453 133.872 C 145.453 133.872 144.398 140.206 143.21 133.872 C 139.647 133.212 139.911 132.553 143.21 131.761 Z', duration: '1.9s' },
        { d: 'M 164.499 98.461 C 164.499 98.461 165.237 94.608 165.893 98.461 C 165.893 98.461 169.582 99.116 165.893 99.772 C 165.893 99.772 165.237 103.707 164.499 99.772 C 162.286 99.362 162.45 98.952 164.499 98.461 Z', duration: '3s' },
        { d: 'M 245.112 190.116 C 245.112 190.116 246.146 184.713 247.066 190.116 C 247.066 190.116 252.239 191.035 247.066 191.955 C 247.066 191.955 246.146 197.473 245.112 191.955 C 242.008 191.38 242.238 190.806 245.112 190.116 Z', duration: '1.6s' },
        { d: 'M 150.284 174.329 C 150.284 174.329 151.022 170.476 151.678 174.329 C 151.678 174.329 155.367 174.984 151.678 175.64 C 151.678 175.64 151.022 179.575 150.284 175.64 C 148.071 175.23 148.235 174.82 150.284 174.329 Z', duration: '3.4s' },
        { d: 'M 224.246 96.605 C 224.246 96.605 224.984 92.752 225.64 96.605 C 225.64 96.605 229.329 97.26 225.64 97.916 C 225.64 97.916 224.984 101.851 224.246 97.916 C 222.033 97.506 222.197 97.096 224.246 96.605 Z', duration: '2.5s' },
        { d: 'M 202.166 155.219 C 202.166 155.219 203.354 149.017 204.409 155.219 C 204.409 155.219 210.347 156.274 204.409 157.33 C 204.409 157.33 203.354 163.664 202.166 157.33 C 198.603 156.67 198.867 156.011 202.166 155.219 Z', duration: '3.9s' }
    ];

    sparklesData.forEach(sparkle => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', sparkle.d);
        path.style.cssText = `
            fill: rgb(250, 231, 170);
            transform-origin: 50% 50%;
            transform-box: fill-box;
            animation: sparkle ${sparkle.duration} 0s infinite ease-in-out;
        `;
        sparklesGroup.appendChild(path);
    });

    svg.appendChild(sparklesGroup);

    loadingOverlay.appendChild(planet);

    const loadingText = document.createElement('p');
    loadingText.textContent = 'dreaming...';
    loadingText.style.cssText = `
        font-family: 'Georgia', serif;
        font-size: 1.2em;
        color: #fff7d1;
        text-transform: lowercase;
        letter-spacing: 2px;
        margin-top: 20px;
        text-shadow: 0 0 10px rgba(255,255,255,0.5);
        animation: loadingText 1.5s ease-in-out infinite;
    `;
    loadingOverlay.appendChild(loadingText);

    loadingOverlay.appendChild(svg);
    document.body.appendChild(loadingOverlay);

    if (!document.getElementById('loaderAnimations')) {
    const style = document.createElement('style');
    style.id = 'loaderAnimations';
    style.textContent = `
        @keyframes rings1 {
            0% { transform: rotateX(65deg) rotateZ(0deg) scale(1.75); }
            100% { transform: rotateX(65deg) rotateZ(360deg) scale(1.75); }
        }
        @keyframes rings2 {
            0% { transform: rotateX(65deg) rotateZ(0deg) scale(1.7); }
            100% { transform: rotateX(65deg) rotateZ(360deg) scale(1.7); }
        }
        @keyframes sparkle {
            0% { transform: scale(0); }
            50% { transform: scale(0); }
            70% { transform: scale(-1, 0); }
            80% { transform: scale(1); }
            100% { transform: scale(0); }
        }
        @keyframes loadingText {
            0%, 100% { opacity: 0.2; letter-spacing: 1px; }
            50% { opacity: 1; letter-spacing: 4px; }
        }
    `;
    document.head.appendChild(style);
}

    return loadingOverlay;
}

function hideLoadingVideo() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.transition = 'opacity 0.6s ease';
        loadingOverlay.style.opacity = '0';

        setTimeout(() => {
            const loadingText = loadingOverlay.querySelector('p');
            if (loadingText) loadingText.remove();
            loadingOverlay.remove();
        }, 600);
    }
}

function showConfirmationReceipt(orderData, itemList, subtotalFormatted, total, selectedDate) {
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'receiptModal';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 3000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 20px;
        padding: 40px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 50px rgba(0, 0, 0, 0.3);
    `;

    let receiptHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #6b4e71; font-size: 1.8em; margin-bottom: 10px;">Order Confirmation ✨</h2>
            <p style="color: #87ceeb;">Please review your order details below</p>
        </div>

        <div style="background: #f8f8f8; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <div style="margin-bottom: 15px;">
                <strong style="color: #6b4e71;">Customer Information</strong>
                <p style="color: #666; margin: 5px 0;">Name: ${orderData.fullName}</p>
                <p style="color: #666; margin: 5px 0;">Email: ${orderData.email}</p>
                <p style="color: #666; margin: 5px 0;">Phone: ${orderData.phone}</p>
            </div>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 15px 0;">

            <div style="margin-bottom: 15px;">
                <strong style="color: #6b4e71;">Order Items</strong>
                <p style="color: #666; margin: 5px 0;">${itemList}</p>
            </div>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 15px 0;">

            <div style="margin-bottom: 15px;">
                <strong style="color: #6b4e71;">Pricing</strong>
                <p style="color: #666; margin: 5px 0;">Subtotal: $${subtotalFormatted}</p>
                ${deliveryFee > 0 ? `<p style="color: #666; margin: 5px 0;">Delivery Fee (${deliveryArea}): $${deliveryFee.toFixed(2)}</p>` : ''}
                <p style="color: #6b4e71; font-weight: bold; margin: 10px 0; font-size: 1.2em;">Total: $${total}</p>
            </div>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 15px 0;">

            <div style="margin-bottom: 15px;">
                <strong style="color: #6b4e71;">Delivery Details</strong>
                <p style="color: #666; margin: 5px 0;">Method: ${orderData.deliveryMethod}${deliveryArea ? ' (' + deliveryArea + ' Area)' : ''}</p>
                ${orderData.address !== 'N/A' ? `<p style="color: #666; margin: 5px 0;">Address: ${orderData.address}</p>` : ''}
                <p style="color: #666; margin: 5px 0;">Date: ${selectedDate}</p>
                <p style="color: #666; margin: 5px 0;">Time: ${selectedTimeSlot}</p>
            </div>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 15px 0;">

            <div>
                <strong style="color: #6b4e71;">Payment Method</strong>
                <p style="color: #666; margin: 5px 0;">${orderData.paymentMethod}</p>
            </div>
        </div>

        <div style="background: #fff9e6; padding: 15px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #ffeaa7;">
            <p style="color: #666; font-size: 0.9em; margin: 0;">We will contact you shortly to confirm your order and arrange payment details. Thank you!</p>
        </div>
    `;

    modalContent.innerHTML = receiptHTML;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 10px;
        margin-top: 20px;
    `;

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Confirm & Submit ✓';
    confirmBtn.style.cssText = `
        flex: 1;
        padding: 12px;
        background: #d4b5e8;
        color: #6b4e71;
        border: none;
        border-radius: 10px;
        font-weight: bold;
        cursor: pointer;
        font-size: 1em;
        transition: all 0.3s;
    `;
    confirmBtn.onmouseover = () => confirmBtn.style.background = '#c4a5d8';
    confirmBtn.onmouseout = () => confirmBtn.style.background = '#d4b5e8';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Edit Order';
    cancelBtn.style.cssText = `
        flex: 1;
        padding: 12px;
        background: #e0e0e0;
        color: #666;
        border: none;
        border-radius: 10px;
        font-weight: bold;
        cursor: pointer;
        font-size: 1em;
        transition: all 0.3s;
    `;
    cancelBtn.onmouseover = () => cancelBtn.style.background = '#d0d0d0';
    cancelBtn.onmouseout = () => cancelBtn.style.background = '#e0e0e0';

    buttonContainer.appendChild(confirmBtn);
    buttonContainer.appendChild(cancelBtn);
    modalContent.appendChild(buttonContainer);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    confirmBtn.onclick = () => {
        modalOverlay.remove();
        const loadingOverlay = showLoadingVideo();
        submitOrderToGoogle(orderData, itemList, subtotalFormatted, total, selectedDate, loadingOverlay);
    };

    cancelBtn.onclick = () => {
        modalOverlay.remove();
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Order ✨';
    };
}

async function submitOrderToGoogle(orderData, itemList, subtotalFormatted, total, selectedDate, loadingOverlay) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify(orderData)
        });

        // Refresh booked slots after successful submission
        await fetchBookedSlots();

        const planet = loadingOverlay.querySelector('.planet-loader');
        const svg = loadingOverlay.querySelector('svg');
        const loadingText = loadingOverlay.querySelector('p');
        if (planet) planet.style.display = 'none';
        if (svg) svg.style.display = 'none';
        if (loadingText) loadingText.style.display = 'none';

        const successContent = document.createElement('div');
        successContent.style.cssText = `
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 50px rgba(0, 0, 0, 0.3);
            text-align: center;
            animation: slideIn 0.5s ease-out;
        `;

        const successHTML = `
            <div style="margin-bottom: 30px;">
                <h2 style="color: #6b4e71; font-size: 2em; margin-bottom: 20px;">Yay ♡ .ᐟ.ᐟ</h2>
                <div style="background: #f0f8ff; padding: 25px; border-radius: 15px; line-height: 1.8; color: #555;">
                    <p style="margin-bottom: 15px;">Thank you for your order! We'll send you a confirmation email within a few hours—your sweet treat is almost on its way. ✧˖°</p>
                    
                    <p style="margin-bottom: 15px;">Once payment is received, we'll bake your goodies fresh with love. (If not, we'll have to cancel—and we'd be so sad to do that ˙ᵕ˙)</p>
                    
                    <p style="color: #6b4e71; font-weight: bold; margin-top: 20px;">Thank you so much for your kind understanding! ᶻ 𝗓 𐰁</p>
                </div>
            </div>

            <div style="background: #f8f8f8; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <strong style="color: #6b4e71; display: block; margin-bottom: 15px;">Order Details</strong>
                <p style="color: #666; margin: 8px 0; text-align: left;"><strong>Email:</strong> ${orderData.email}</p>
                <p style="color: #666; margin: 8px 0; text-align: left;"><strong>Phone:</strong> ${orderData.phone}</p>
                <p style="color: #666; margin: 8px 0; text-align: left;"><strong>Items:</strong> ${itemList}</p>
                <p style="color: #666; margin: 8px 0; text-align: left;"><strong>Date:</strong> ${selectedDate}</p>
                <p style="color: #666; margin: 8px 0; text-align: left;"><strong>Time:</strong> ${selectedTimeSlot}</p>
                <p style="color: #6b4e71; font-weight: bold; margin: 12px 0 0 0; text-align: left; font-size: 1.1em;"><strong>Total:</strong> ${total}</p>
            </div>
        `;

        successContent.innerHTML = successHTML;

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Back to Home ✨';
        closeBtn.style.cssText = `
            width: 100%;
            padding: 12px;
            background: #d4b5e8;
            color: #6b4e71;
            border: none;
            border-radius: 10px;
            font-weight: bold;
            cursor: pointer;
            font-size: 1em;
            transition: all 0.3s;
        `;
        closeBtn.onmouseover = () => closeBtn.style.background = '#c4a5d8';
        closeBtn.onmouseout = () => closeBtn.style.background = '#d4b5e8';
        closeBtn.onclick = () => {
            loadingOverlay.remove();
            resetForm();
            showPage('home-page');
        };

        successContent.appendChild(closeBtn);
        
        if (!document.getElementById('slideInAnimation')) {
            const style = document.createElement('style');
            style.id = 'slideInAnimation';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        loadingOverlay.style.background = 'rgba(0, 0, 0, 0.5)';
        loadingOverlay.appendChild(successContent);
        
    } catch (error) {
        console.error('Submission error:', error);
        hideLoadingVideo();
        alert('⚠️ There was an error submitting your order.\n\nPlease try again or contact us directly:\n\nName: ' + orderData.fullName + '\nEmail: ' + orderData.email + '\nPhone: ' + orderData.phone);
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Order ✨';
    }
}

document.getElementById('orderForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const totalItems = orderItems.brookie + orderItems.ubeCoconut + orderItems.ubeCheese;
    if (totalItems === 0) {
        document.getElementById('orderError').style.display = 'block';
        return;
    }
    document.getElementById('orderError').style.display = 'none';

    if (!selectedTimeSlot) {
        document.getElementById('timeError').style.display = 'block';
        return;
    }
    document.getElementById('timeError').style.display = 'none';
    
    const formData = new FormData(e.target);
    const selectedDate = formData.get('date');
    
    const subtotal = 
        orderItems.brookie * 2.99 +
        orderItems.ubeCoconut * 5.50 +
        orderItems.ubeCheese * 5.50;
    const total = (subtotal + deliveryFee).toFixed(2);
    const subtotalFormatted = subtotal.toFixed(2);
    
    let itemList = '';
    if (orderItems.brookie > 0) itemList += `Brookie Monsters x${orderItems.brookie}, `;
    if (orderItems.ubeCoconut > 0) itemList += `Ube Dream Tres Leches (Coconut Flakes) x${orderItems.ubeCoconut}, `;
    if (orderItems.ubeCheese > 0) itemList += `Ube Dream Tres Leches (Cheese) x${orderItems.ubeCheese}`;
    
    itemList = itemList.replace(/, $/, '');
    
    const orderData = {
        timestamp: new Date().toISOString(),
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        paymentMethod: formData.get('paymentMethod'),
        deliveryMethod: formData.get('deliveryMethod') === 'pickup' ? 'Pick-up' : 'Delivery',
        deliveryArea: deliveryArea || 'N/A',
        address: formData.get('address') || 'N/A',
        brookieQty: orderItems.brookie,
        ubeCoconutQty: orderItems.ubeCoconut,
        ubeCheeseQty: orderItems.ubeCheese,
        items: itemList,
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        total: total,
        date: selectedDate,
        time: selectedTimeSlot,
        specialRequests: formData.get('specialRequests') || 'None'
    };

    if (!bookedSlots[selectedDate]) {
        bookedSlots[selectedDate] = [];
    }
    bookedSlots[selectedDate].push(selectedTimeSlot);

    showConfirmationReceipt(orderData, itemList, subtotalFormatted, total, selectedDate);
});

function resetForm() {
    document.getElementById('orderForm').reset();
    orderItems.brookie = 0;
    orderItems.ubeCoconut = 0;
    orderItems.ubeCheese = 0;
    document.getElementById('qty-brookie').textContent = '0';
    document.getElementById('qty-ubeCoconut').textContent = '0';
    document.getElementById('qty-ubeCheese').textContent = '0';
    document.querySelectorAll('.menu-select-item').forEach(item => item.classList.remove('selected'));
    document.getElementById('timeSlotGroup').style.display = 'none';
    addressGroup.style.display = 'none';
    deliveryFee = 0;
    deliveryArea = '';
    selectedTimeSlot = null;
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Order ✨';
}

function setDateRestrictions() {
    const dateInput = document.getElementById('date');
    const today = new Date();
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];
    
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 3);
    const maxDateStr = maxDate.toISOString().split('T')[0];
    
    dateInput.setAttribute('min', minDate);
    dateInput.setAttribute('max', maxDateStr);
}

window.addEventListener('load', () => {
  const intro = document.getElementById('intro');
  const introVideo = document.getElementById('introVideo');

  setDateRestrictions();
  
  // Fetch booked slots when page loads
  fetchBookedSlots();

  introVideo.addEventListener('ended', () => {
    intro.classList.add('slide-up');
    setTimeout(() => {
      intro.style.display = 'none';
      document.getElementById('home-page').classList.add('active');
    }, 1500);
  });
}); + deliveryFee + ')';
        } else if (dayOfWeek === scheduleConfig.delivery.sunday.day) {
            availableSlots = generateTimeSlots(
                scheduleConfig.delivery.sunday.startTime,
                scheduleConfig.delivery.sunday.endTime,
                scheduleConfig.delivery.sunday.duration
            );
            deliveryArea = scheduleConfig.delivery.sunday.area;
            deliveryFee = scheduleConfig.delivery.sunday.fee;
            dayLabel = 'Delivery - ' + deliveryArea + ' Area (+ $' + deliveryFee + ')';

function selectTimeSlot(time, element, date) {
    document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));
    element.classList.add('selected');
    selectedTimeSlot = time;
    document.getElementById('timeError').style.display = 'none';
}

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxKSjTlLvY0oZp9RhqwLa8W6c-YRN5Ql1M-UUPlMYEf1pAIn7UlgqntMfSxdEJQhfEFdQ/exec';

function showLoadingVideo() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loadingOverlay';
    loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(34, 34, 41, 0.95);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 4000;
        gap: 80px;
    `;

    const planet = document.createElement('div');
    planet.className = 'planet-loader';
    planet.style.cssText = `
        display: block;
        width: 125px;
        height: 125px;
        position: relative;
        transform-style: preserve-3d;
        border-radius: 50%;
        background: linear-gradient(
          180deg,
          rgba(252, 201, 107, 1) 0%,
          rgba(252, 201, 107, 1) 15%,
          rgba(247, 174, 1, 1) 15%,
          rgba(247, 174, 1, 1) 19%,
          rgba(252, 201, 107, 1) 19%,
          rgba(252, 201, 107, 1) 22%,
          rgba(247, 174, 1, 1) 22%,
          rgba(247, 174, 1, 1) 28%,
          rgba(252, 201, 107, 1) 28%,
          rgba(252, 201, 107, 1) 31%,
          rgba(252, 201, 107, 1) 33%,
          rgba(252, 201, 107, 1) 36%,
          rgba(247, 174, 1, 1) 36%,
          rgba(247, 174, 1, 1) 48%,
          rgba(252, 201, 107, 1) 48%,
          rgba(252, 201, 107, 1) 55%,
          rgba(247, 174, 1, 1) 55%,
          rgba(247, 174, 1, 1) 66%,
          rgba(252, 201, 107, 1) 66%,
          rgba(252, 201, 107, 1) 70%,
          rgba(247, 174, 1, 1) 70%,
          rgba(247, 174, 1, 1) 73%,
          rgba(252, 201, 107, 1) 73%,
          rgba(252, 201, 107, 1) 82%,
          rgba(247, 174, 1, 1) 82%,
          rgba(247, 174, 1, 1) 86%,
          rgba(252, 201, 107, 1) 86%
        );
        box-shadow: inset 0 0 25px rgba(0, 0, 0, 0.25),
          inset 8px -4px 6px rgba(199, 128, 0, 0.5),
          inset -8px 4px 8px rgba(255, 235, 199, 0.5),
          inset 20px -5px 12px #f7ae01,
          0 0 100px rgba(255, 255, 255, 0.35);
        transform: rotateZ(-15deg);
    `;

    const planetBefore = document.createElement('div');
    planetBefore.style.cssText = `
        position: absolute;
        content: "";
        display: block;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        border: 16px solid #7b6f42;
        border-top-width: 0;
        border-radius: 50%;
        box-shadow: 0 -2px 0 #b1a693;
        animation: rings1 0.8s infinite linear;
        top: 0;
        left: 0;
    `;

    const planetAfter = document.createElement('div');
    planetAfter.style.cssText = `
        position: absolute;
        content: "";
        display: block;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        border: 8px solid #b1a693;
        border-top-width: 0;
        border-radius: 50%;
        box-shadow: 0 -2px 0 #7b6f42;
        animation: rings2 0.8s infinite linear;
        top: 0;
        left: 0;
    `;

    planet.appendChild(planetBefore);
    planet.appendChild(planetAfter);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '114.551 81.194 134.814 113.214');
    svg.style.cssText = `
        z-index: 1;
        width: 50vw;
        max-width: 40rem;
        height: auto;
    `;

    const sparklesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    sparklesGroup.setAttribute('class', 'sparkles-loader');

    const sparklesData = [
        { d: 'M 143.21 131.761 C 143.21 131.761 144.398 125.559 145.453 131.761 C 145.453 131.761 151.391 132.816 145.453 133.872 C 145.453 133.872 144.398 140.206 143.21 133.872 C 139.647 133.212 139.911 132.553 143.21 131.761 Z', duration: '1.9s' },
        { d: 'M 164.499 98.461 C 164.499 98.461 165.237 94.608 165.893 98.461 C 165.893 98.461 169.582 99.116 165.893 99.772 C 165.893 99.772 165.237 103.707 164.499 99.772 C 162.286 99.362 162.45 98.952 164.499 98.461 Z', duration: '3s' },
        { d: 'M 245.112 190.116 C 245.112 190.116 246.146 184.713 247.066 190.116 C 247.066 190.116 252.239 191.035 247.066 191.955 C 247.066 191.955 246.146 197.473 245.112 191.955 C 242.008 191.38 242.238 190.806 245.112 190.116 Z', duration: '1.6s' },
        { d: 'M 150.284 174.329 C 150.284 174.329 151.022 170.476 151.678 174.329 C 151.678 174.329 155.367 174.984 151.678 175.64 C 151.678 175.64 151.022 179.575 150.284 175.64 C 148.071 175.23 148.235 174.82 150.284 174.329 Z', duration: '3.4s' },
        { d: 'M 224.246 96.605 C 224.246 96.605 224.984 92.752 225.64 96.605 C 225.64 96.605 229.329 97.26 225.64 97.916 C 225.64 97.916 224.984 101.851 224.246 97.916 C 222.033 97.506 222.197 97.096 224.246 96.605 Z', duration: '2.5s' },
        { d: 'M 202.166 155.219 C 202.166 155.219 203.354 149.017 204.409 155.219 C 204.409 155.219 210.347 156.274 204.409 157.33 C 204.409 157.33 203.354 163.664 202.166 157.33 C 198.603 156.67 198.867 156.011 202.166 155.219 Z', duration: '3.9s' }
    ];

    sparklesData.forEach(sparkle => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', sparkle.d);
        path.style.cssText = `
            fill: rgb(250, 231, 170);
            transform-origin: 50% 50%;
            transform-box: fill-box;
            animation: sparkle ${sparkle.duration} 0s infinite ease-in-out;
        `;
        sparklesGroup.appendChild(path);
    });

    svg.appendChild(sparklesGroup);

    loadingOverlay.appendChild(planet);

    const loadingText = document.createElement('p');
    loadingText.textContent = 'dreaming...';
    loadingText.style.cssText = `
        font-family: 'Georgia', serif;
        font-size: 1.2em;
        color: #fff7d1;
        text-transform: lowercase;
        letter-spacing: 2px;
        margin-top: 20px;
        text-shadow: 0 0 10px rgba(255,255,255,0.5);
        animation: loadingText 1.5s ease-in-out infinite;
    `;
    loadingOverlay.appendChild(loadingText);

    loadingOverlay.appendChild(svg);
    document.body.appendChild(loadingOverlay);

    if (!document.getElementById('loaderAnimations')) {
    const style = document.createElement('style');
    style.id = 'loaderAnimations';
    style.textContent = `
        @keyframes rings1 {
            0% { transform: rotateX(65deg) rotateZ(0deg) scale(1.75); }
            100% { transform: rotateX(65deg) rotateZ(360deg) scale(1.75); }
        }
        @keyframes rings2 {
            0% { transform: rotateX(65deg) rotateZ(0deg) scale(1.7); }
            100% { transform: rotateX(65deg) rotateZ(360deg) scale(1.7); }
        }
        @keyframes sparkle {
            0% { transform: scale(0); }
            50% { transform: scale(0); }
            70% { transform: scale(-1, 0); }
            80% { transform: scale(1); }
            100% { transform: scale(0); }
        }
        @keyframes loadingText {
            0%, 100% { opacity: 0.2; letter-spacing: 1px; }
            50% { opacity: 1; letter-spacing: 4px; }
        }
    `;
    document.head.appendChild(style);
}

    return loadingOverlay;
}

function hideLoadingVideo() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.transition = 'opacity 0.6s ease';
        loadingOverlay.style.opacity = '0';

        setTimeout(() => {
            const loadingText = loadingOverlay.querySelector('p');
            if (loadingText) loadingText.remove();
            loadingOverlay.remove();
        }, 600);
    }
}

function showConfirmationReceipt(orderData, itemList, subtotalFormatted, total, selectedDate) {
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'receiptModal';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 3000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 20px;
        padding: 40px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 50px rgba(0, 0, 0, 0.3);
    `;

    let receiptHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #6b4e71; font-size: 1.8em; margin-bottom: 10px;">Order Confirmation ✨</h2>
            <p style="color: #87ceeb;">Please review your order details below</p>
        </div>

        <div style="background: #f8f8f8; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <div style="margin-bottom: 15px;">
                <strong style="color: #6b4e71;">Customer Information</strong>
                <p style="color: #666; margin: 5px 0;">Name: ${orderData.fullName}</p>
                <p style="color: #666; margin: 5px 0;">Email: ${orderData.email}</p>
                <p style="color: #666; margin: 5px 0;">Phone: ${orderData.phone}</p>
            </div>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 15px 0;">

            <div style="margin-bottom: 15px;">
                <strong style="color: #6b4e71;">Order Items</strong>
                <p style="color: #666; margin: 5px 0;">${itemList}</p>
            </div>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 15px 0;">

            <div style="margin-bottom: 15px;">
                <strong style="color: #6b4e71;">Pricing</strong>
                <p style="color: #666; margin: 5px 0;">Subtotal: $${subtotalFormatted}</p>
                ${deliveryFee > 0 ? `<p style="color: #666; margin: 5px 0;">Delivery Fee (${deliveryArea}): $${deliveryFee.toFixed(2)}</p>` : ''}
                <p style="color: #6b4e71; font-weight: bold; margin: 10px 0; font-size: 1.2em;">Total: $${total}</p>
            </div>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 15px 0;">

            <div style="margin-bottom: 15px;">
                <strong style="color: #6b4e71;">Delivery Details</strong>
                <p style="color: #666; margin: 5px 0;">Method: ${orderData.deliveryMethod}${deliveryArea ? ' (' + deliveryArea + ' Area)' : ''}</p>
                ${orderData.address !== 'N/A' ? `<p style="color: #666; margin: 5px 0;">Address: ${orderData.address}</p>` : ''}
                <p style="color: #666; margin: 5px 0;">Date: ${selectedDate}</p>
                <p style="color: #666; margin: 5px 0;">Time: ${selectedTimeSlot}</p>
            </div>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 15px 0;">

            <div>
                <strong style="color: #6b4e71;">Payment Method</strong>
                <p style="color: #666; margin: 5px 0;">${orderData.paymentMethod}</p>
            </div>
        </div>

        <div style="background: #fff9e6; padding: 15px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #ffeaa7;">
            <p style="color: #666; font-size: 0.9em; margin: 0;">We will contact you shortly to confirm your order and arrange payment details. Thank you!</p>
        </div>
    `;

    modalContent.innerHTML = receiptHTML;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 10px;
        margin-top: 20px;
    `;

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Confirm & Submit ✓';
    confirmBtn.style.cssText = `
        flex: 1;
        padding: 12px;
        background: #d4b5e8;
        color: #6b4e71;
        border: none;
        border-radius: 10px;
        font-weight: bold;
        cursor: pointer;
        font-size: 1em;
        transition: all 0.3s;
    `;
    confirmBtn.onmouseover = () => confirmBtn.style.background = '#c4a5d8';
    confirmBtn.onmouseout = () => confirmBtn.style.background = '#d4b5e8';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Edit Order';
    cancelBtn.style.cssText = `
        flex: 1;
        padding: 12px;
        background: #e0e0e0;
        color: #666;
        border: none;
        border-radius: 10px;
        font-weight: bold;
        cursor: pointer;
        font-size: 1em;
        transition: all 0.3s;
    `;
    cancelBtn.onmouseover = () => cancelBtn.style.background = '#d0d0d0';
    cancelBtn.onmouseout = () => cancelBtn.style.background = '#e0e0e0';

    buttonContainer.appendChild(confirmBtn);
    buttonContainer.appendChild(cancelBtn);
    modalContent.appendChild(buttonContainer);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    confirmBtn.onclick = () => {
        modalOverlay.remove();
        const loadingOverlay = showLoadingVideo();
        submitOrderToGoogle(orderData, itemList, subtotalFormatted, total, selectedDate, loadingOverlay);
    };

    cancelBtn.onclick = () => {
        modalOverlay.remove();
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Order ✨';
    };
}

async function submitOrderToGoogle(orderData, itemList, subtotalFormatted, total, selectedDate, loadingOverlay) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify(orderData)
        });

        const planet = loadingOverlay.querySelector('.planet-loader');
        const svg = loadingOverlay.querySelector('svg');
        const loadingText = loadingOverlay.querySelector('p');
        if (planet) planet.style.display = 'none';
        if (svg) svg.style.display = 'none';
        if (loadingText) loadingText.style.display = 'none';

        const successContent = document.createElement('div');
        successContent.style.cssText = `
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 50px rgba(0, 0, 0, 0.3);
            text-align: center;
            animation: slideIn 0.5s ease-out;
        `;

        const successHTML = `
            <div style="margin-bottom: 30px;">
                <h2 style="color: #6b4e71; font-size: 2em; margin-bottom: 20px;">Yay ♡ .ᐟ.ᐟ</h2>
                <div style="background: #f0f8ff; padding: 25px; border-radius: 15px; line-height: 1.8; color: #555;">
                    <p style="margin-bottom: 15px;">Thank you for your order! We'll send you a confirmation email within a few hours—your sweet treat is almost on its way. ✧˖°</p>
                    
                    <p style="margin-bottom: 15px;">Once payment is received, we'll bake your goodies fresh with love. (If not, we'll have to cancel—and we'd be so sad to do that ˙ᵕ˙)</p>
                    
                    <p style="color: #6b4e71; font-weight: bold; margin-top: 20px;">Thank you so much for your kind understanding! ᶻ 𝗓 𐰁</p>
                </div>
            </div>

            <div style="background: #f8f8f8; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <strong style="color: #6b4e71; display: block; margin-bottom: 15px;">Order Details</strong>
                <p style="color: #666; margin: 8px 0; text-align: left;"><strong>Email:</strong> ${orderData.email}</p>
                <p style="color: #666; margin: 8px 0; text-align: left;"><strong>Phone:</strong> ${orderData.phone}</p>
                <p style="color: #666; margin: 8px 0; text-align: left;"><strong>Items:</strong> ${itemList}</p>
                <p style="color: #666; margin: 8px 0; text-align: left;"><strong>Date:</strong> ${selectedDate}</p>
                <p style="color: #666; margin: 8px 0; text-align: left;"><strong>Time:</strong> ${selectedTimeSlot}</p>
                <p style="color: #6b4e71; font-weight: bold; margin: 12px 0 0 0; text-align: left; font-size: 1.1em;"><strong>Total:</strong> ${total}</p>
            </div>
        `;

        successContent.innerHTML = successHTML;

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Back to Home ✨';
        closeBtn.style.cssText = `
            width: 100%;
            padding: 12px;
            background: #d4b5e8;
            color: #6b4e71;
            border: none;
            border-radius: 10px;
            font-weight: bold;
            cursor: pointer;
            font-size: 1em;
            transition: all 0.3s;
        `;
        closeBtn.onmouseover = () => closeBtn.style.background = '#c4a5d8';
        closeBtn.onmouseout = () => closeBtn.style.background = '#d4b5e8';
        closeBtn.onclick = () => {
            loadingOverlay.remove();
            resetForm();
            showPage('home-page');
        };

        successContent.appendChild(closeBtn);
        
        if (!document.getElementById('slideInAnimation')) {
            const style = document.createElement('style');
            style.id = 'slideInAnimation';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        loadingOverlay.style.background = 'rgba(0, 0, 0, 0.5)';
        loadingOverlay.appendChild(successContent);
        
    } catch (error) {
        console.error('Submission error:', error);
        hideLoadingVideo();
        alert('⚠️ There was an error submitting your order.\n\nPlease try again or contact us directly:\n\nName: ' + orderData.fullName + '\nEmail: ' + orderData.email + '\nPhone: ' + orderData.phone);
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Order ✨';
    }
}

document.getElementById('orderForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const totalItems = orderItems.brookie + orderItems.ubeCoconut + orderItems.ubeCheese;
    if (totalItems === 0) {
        document.getElementById('orderError').style.display = 'block';
        return;
    }
    document.getElementById('orderError').style.display = 'none';

    if (!selectedTimeSlot) {
        document.getElementById('timeError').style.display = 'block';
        return;
    }
    document.getElementById('timeError').style.display = 'none';
    
    const formData = new FormData(e.target);
    const selectedDate = formData.get('date');
    
    const subtotal = 
        orderItems.brookie * 2.99 +
        orderItems.ubeCoconut * 5.50 +
        orderItems.ubeCheese * 5.50;
    const total = (subtotal + deliveryFee).toFixed(2);
    const subtotalFormatted = subtotal.toFixed(2);
    
    let itemList = '';
    if (orderItems.brookie > 0) itemList += `Brookie Monsters x${orderItems.brookie}, `;
    if (orderItems.ubeCoconut > 0) itemList += `Ube Dream Tres Leches (Coconut Flakes) x${orderItems.ubeCoconut}, `;
    if (orderItems.ubeCheese > 0) itemList += `Ube Dream Tres Leches (Cheese) x${orderItems.ubeCheese}`;
    
    itemList = itemList.replace(/, $/, '');
    
    const orderData = {
        timestamp: new Date().toISOString(),
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        paymentMethod: formData.get('paymentMethod'),
        deliveryMethod: formData.get('deliveryMethod') === 'pickup' ? 'Pick-up' : 'Delivery',
        deliveryArea: deliveryArea || 'N/A',
        address: formData.get('address') || 'N/A',
        brookieQty: orderItems.brookie,
        ubeCoconutQty: orderItems.ubeCoconut,
        ubeCheeseQty: orderItems.ubeCheese,
        items: itemList,
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        total: total,
        date: selectedDate,
        time: selectedTimeSlot,
        specialRequests: formData.get('specialRequests') || 'None'
    };

    if (!bookedSlots[selectedDate]) {
        bookedSlots[selectedDate] = [];
    }
    bookedSlots[selectedDate].push(selectedTimeSlot);

    showConfirmationReceipt(orderData, itemList, subtotalFormatted, total, selectedDate);
});

function resetForm() {
    document.getElementById('orderForm').reset();
    orderItems.brookie = 0;
    orderItems.ubeCoconut = 0;
    orderItems.ubeCheese = 0;
    document.getElementById('qty-brookie').textContent = '0';
    document.getElementById('qty-ubeCoconut').textContent = '0';
    document.getElementById('qty-ubeCheese').textContent = '0';
    document.querySelectorAll('.menu-select-item').forEach(item => item.classList.remove('selected'));
    document.getElementById('timeSlotGroup').style.display = 'none';
    addressGroup.style.display = 'none';
    deliveryFee = 0;
    deliveryArea = '';
    selectedTimeSlot = null;
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Order ✨';
}

function setDateRestrictions() {
    const dateInput = document.getElementById('date');
    const today = new Date();
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];
    
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 3);
    const maxDateStr = maxDate.toISOString().split('T')[0];
    
    dateInput.setAttribute('min', minDate);
    dateInput.setAttribute('max', maxDateStr);
}

window.addEventListener('load', () => {
  const intro = document.getElementById('intro');
  const introVideo = document.getElementById('introVideo');

  setDateRestrictions();

  introVideo.addEventListener('ended', () => {
    intro.classList.add('slide-up');
    setTimeout(() => {
      intro.style.display = 'none';
      document.getElementById('home-page').classList.add('active');
    }, 1500);
  });
}); + deliveryFee + ')';
        } else {
            document.getElementById('timeSlotGroup').style.display = 'block';
            selectorDiv.innerHTML = '<p style="color: #ff6b6b; padding: 15px; text-align: center;">Delivery is only available on:<br>• Saturday (Eau Claire area) 2:30 PM - 5:00 PM<br>• Sunday (Mondovi area) 2:30 PM - 4:30 PM<br>Please select a different date.</p>';
            return;
        }
    }
    
    if (availableSlots.length > 0) {
        document.getElementById('timeSlotGroup').style.display = 'block';
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'schedule-info';
        infoDiv.style.cssText = 'background: #e8f5e9; padding: 10px; border-radius: 8px; margin-bottom: 15px; text-align: center; color: #2e7d32; font-weight: bold;';
        infoDiv.textContent = dayLabel;
        selectorDiv.parentElement.insertBefore(infoDiv, selectorDiv);
        
        // Get booked times for this date from Google Sheets
        const bookedTimes = bookedSlots[selectedDate] || [];
        console.log('Booked times for ' + selectedDate + ':', bookedTimes);
        
        availableSlots.forEach(time => {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'time-slot';
            slotDiv.textContent = time;
            
            // Check if this time slot is already booked
            if (bookedTimes.includes(time)) {
                slotDiv.classList.add('taken');
                slotDiv.title = 'This time slot is already booked';
                console.log('Marking ' + time + ' as taken');
            } else {
                slotDiv.onclick = () => selectTimeSlot(time, slotDiv, selectedDate);
            }
            selectorDiv.appendChild(slotDiv);
        });
    }
}

function selectTimeSlot(time, element, date) {
    document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));
    element.classList.add('selected');
    selectedTimeSlot = time;
    document.getElementById('timeError').style.display = 'none';
}

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxvN2FEqqUpPtRigM4izzbGhrVjFguD9NhCuLJBkowZOyy1Fk8E1Vik8dv-xxhPDR1W/exec';

function showLoadingVideo() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loadingOverlay';
    loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(34, 34, 41, 0.95);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 4000;
        gap: 80px;
    `;

    const planet = document.createElement('div');
    planet.className = 'planet-loader';
    planet.style.cssText = `
        display: block;
        width: 125px;
        height: 125px;
        position: relative;
        transform-style: preserve-3d;
        border-radius: 50%;
        background: linear-gradient(
          180deg,
          rgba(252, 201, 107, 1) 0%,
          rgba(252, 201, 107, 1) 15%,
          rgba(247, 174, 1, 1) 15%,
          rgba(247, 174, 1, 1) 19%,
          rgba(252, 201, 107, 1) 19%,
          rgba(252, 201, 107, 1) 22%,
          rgba(247, 174, 1, 1) 22%,
          rgba(247, 174, 1, 1) 28%,
          rgba(252, 201, 107, 1) 28%,
          rgba(252, 201, 107, 1) 31%,
          rgba(252, 201, 107, 1) 33%,
          rgba(252, 201, 107, 1) 36%,
          rgba(247, 174, 1, 1) 36%,
          rgba(247, 174, 1, 1) 48%,
          rgba(252, 201, 107, 1) 48%,
          rgba(252, 201, 107, 1) 55%,
          rgba(247, 174, 1, 1) 55%,
          rgba(247, 174, 1, 1) 66%,
          rgba(252, 201, 107, 1) 66%,
          rgba(252, 201, 107, 1) 70%,
          rgba(247, 174, 1, 1) 70%,
          rgba(247, 174, 1, 1) 73%,
          rgba(252, 201, 107, 1) 73%,
          rgba(252, 201, 107, 1) 82%,
          rgba(247, 174, 1, 1) 82%,
          rgba(247, 174, 1, 1) 86%,
          rgba(252, 201, 107, 1) 86%
        );
        box-shadow: inset 0 0 25px rgba(0, 0, 0, 0.25),
          inset 8px -4px 6px rgba(199, 128, 0, 0.5),
          inset -8px 4px 8px rgba(255, 235, 199, 0.5),
          inset 20px -5px 12px #f7ae01,
          0 0 100px rgba(255, 255, 255, 0.35);
        transform: rotateZ(-15deg);
    `;

    const planetBefore = document.createElement('div');
    planetBefore.style.cssText = `
        position: absolute;
        content: "";
        display: block;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        border: 16px solid #7b6f42;
        border-top-width: 0;
        border-radius: 50%;
        box-shadow: 0 -2px 0 #b1a693;
        animation: rings1 0.8s infinite linear;
        top: 0;
        left: 0;
    `;

    const planetAfter = document.createElement('div');
    planetAfter.style.cssText = `
        position: absolute;
        content: "";
        display: block;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        border: 8px solid #b1a693;
        border-top-width: 0;
        border-radius: 50%;
        box-shadow: 0 -2px 0 #7b6f42;
        animation: rings2 0.8s infinite linear;
        top: 0;
        left: 0;
    `;

    planet.appendChild(planetBefore);
    planet.appendChild(planetAfter);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '114.551 81.194 134.814 113.214');
    svg.style.cssText = `
        z-index: 1;
        width: 50vw;
        max-width: 40rem;
        height: auto;
    `;

    const sparklesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    sparklesGroup.setAttribute('class', 'sparkles-loader');

    const sparklesData = [
        { d: 'M 143.21 131.761 C 143.21 131.761 144.398 125.559 145.453 131.761 C 145.453 131.761 151.391 132.816 145.453 133.872 C 145.453 133.872 144.398 140.206 143.21 133.872 C 139.647 133.212 139.911 132.553 143.21 131.761 Z', duration: '1.9s' },
        { d: 'M 164.499 98.461 C 164.499 98.461 165.237 94.608 165.893 98.461 C 165.893 98.461 169.582 99.116 165.893 99.772 C 165.893 99.772 165.237 103.707 164.499 99.772 C 162.286 99.362 162.45 98.952 164.499 98.461 Z', duration: '3s' },
        { d: 'M 245.112 190.116 C 245.112 190.116 246.146 184.713 247.066 190.116 C 247.066 190.116 252.239 191.035 247.066 191.955 C 247.066 191.955 246.146 197.473 245.112 191.955 C 242.008 191.38 242.238 190.806 245.112 190.116 Z', duration: '1.6s' },
        { d: 'M 150.284 174.329 C 150.284 174.329 151.022 170.476 151.678 174.329 C 151.678 174.329 155.367 174.984 151.678 175.64 C 151.678 175.64 151.022 179.575 150.284 175.64 C 148.071 175.23 148.235 174.82 150.284 174.329 Z', duration: '3.4s' },
        { d: 'M 224.246 96.605 C 224.246 96.605 224.984 92.752 225.64 96.605 C 225.64 96.605 229.329 97.26 225.64 97.916 C 225.64 97.916 224.984 101.851 224.246 97.916 C 222.033 97.506 222.197 97.096 224.246 96.605 Z', duration: '2.5s' },
        { d: 'M 202.166 155.219 C 202.166 155.219 203.354 149.017 204.409 155.219 C 204.409 155.219 210.347 156.274 204.409 157.33 C 204.409 157.33 203.354 163.664 202.166 157.33 C 198.603 156.67 198.867 156.011 202.166 155.219 Z', duration: '3.9s' }
    ];

    sparklesData.forEach(sparkle => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', sparkle.d);
        path.style.cssText = `
            fill: rgb(250, 231, 170);
            transform-origin: 50% 50%;
            transform-box: fill-box;
            animation: sparkle ${sparkle.duration} 0s infinite ease-in-out;
        `;
        sparklesGroup.appendChild(path);
    });

    svg.appendChild(sparklesGroup);

    loadingOverlay.appendChild(planet);

    const loadingText = document.createElement('p');
    loadingText.textContent = 'dreaming...';
    loadingText.style.cssText = `
        font-family: 'Georgia', serif;
        font-size: 1.2em;
        color: #fff7d1;
        text-transform: lowercase;
        letter-spacing: 2px;
        margin-top: 20px;
        text-shadow: 0 0 10px rgba(255,255,255,0.5);
        animation: loadingText 1.5s ease-in-out infinite;
    `;
    loadingOverlay.appendChild(loadingText);

    loadingOverlay.appendChild(svg);
    document.body.appendChild(loadingOverlay);

    if (!document.getElementById('loaderAnimations')) {
    const style = document.createElement('style');
    style.id = 'loaderAnimations';
    style.textContent = `
        @keyframes rings1 {
            0% { transform: rotateX(65deg) rotateZ(0deg) scale(1.75); }
            100% { transform: rotateX(65deg) rotateZ(360deg) scale(1.75); }
        }
        @keyframes rings2 {
            0% { transform: rotateX(65deg) rotateZ(0deg) scale(1.7); }
            100% { transform: rotateX(65deg) rotateZ(360deg) scale(1.7); }
        }
        @keyframes sparkle {
            0% { transform: scale(0); }
            50% { transform: scale(0); }
            70% { transform: scale(-1, 0); }
            80% { transform: scale(1); }
            100% { transform: scale(0); }
        }
        @keyframes loadingText {
            0%, 100% { opacity: 0.2; letter-spacing: 1px; }
            50% { opacity: 1; letter-spacing: 4px; }
        }
    `;
    document.head.appendChild(style);
}

    return loadingOverlay;
}

function hideLoadingVideo() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.transition = 'opacity 0.6s ease';
        loadingOverlay.style.opacity = '0';

        setTimeout(() => {
            const loadingText = loadingOverlay.querySelector('p');
            if (loadingText) loadingText.remove();
            loadingOverlay.remove();
        }, 600);
    }
}

function showConfirmationReceipt(orderData, itemList, subtotalFormatted, total, selectedDate) {
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'receiptModal';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 3000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 20px;
        padding: 40px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 50px rgba(0, 0, 0, 0.3);
    `;

    let receiptHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #6b4e71; font-size: 1.8em; margin-bottom: 10px;">Order Confirmation ✨</h2>
            <p style="color: #87ceeb;">Please review your order details below</p>
        </div>

        <div style="background: #f8f8f8; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <div style="margin-bottom: 15px;">
                <strong style="color: #6b4e71;">Customer Information</strong>
                <p style="color: #666; margin: 5px 0;">Name: ${orderData.fullName}</p>
                <p style="color: #666; margin: 5px 0;">Email: ${orderData.email}</p>
                <p style="color: #666; margin: 5px 0;">Phone: ${orderData.phone}</p>
            </div>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 15px 0;">

            <div style="margin-bottom: 15px;">
                <strong style="color: #6b4e71;">Order Items</strong>
                <p style="color: #666; margin: 5px 0;">${itemList}</p>
            </div>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 15px 0;">

            <div style="margin-bottom: 15px;">
                <strong style="color: #6b4e71;">Pricing</strong>
                <p style="color: #666; margin: 5px 0;">Subtotal: $${subtotalFormatted}</p>
                ${deliveryFee > 0 ? `<p style="color: #666; margin: 5px 0;">Delivery Fee (${deliveryArea}): $${deliveryFee.toFixed(2)}</p>` : ''}
                <p style="color: #6b4e71; font-weight: bold; margin: 10px 0; font-size: 1.2em;">Total: $${total}</p>
            </div>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 15px 0;">

            <div style="margin-bottom: 15px;">
                <strong style="color: #6b4e71;">Delivery Details</strong>
                <p style="color: #666; margin: 5px 0;">Method: ${orderData.deliveryMethod}${deliveryArea ? ' (' + deliveryArea + ' Area)' : ''}</p>
                ${orderData.address !== 'N/A' ? `<p style="color: #666; margin: 5px 0;">Address: ${orderData.address}</p>` : ''}
                <p style="color: #666; margin: 5px 0;">Date: ${selectedDate}</p>
                <p style="color: #666; margin: 5px 0;">Time: ${selectedTimeSlot}</p>
            </div>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 15px 0;">

            <div>
                <strong style="color: #6b4e71;">Payment Method</strong>
                <p style="color: #666; margin: 5px 0;">${orderData.paymentMethod}</p>
            </div>
        </div>

        <div style="background: #fff9e6; padding: 15px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #ffeaa7;">
            <p style="color: #666; font-size: 0.9em; margin: 0;">We will contact you shortly to confirm your order and arrange payment details. Thank you!</p>
        </div>
    `;

    modalContent.innerHTML = receiptHTML;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 10px;
        margin-top: 20px;
    `;

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Confirm & Submit ✓';
    confirmBtn.style.cssText = `
        flex: 1;
        padding: 12px;
        background: #d4b5e8;
        color: #6b4e71;
        border: none;
        border-radius: 10px;
        font-weight: bold;
        cursor: pointer;
        font-size: 1em;
        transition: all 0.3s;
    `;
    confirmBtn.onmouseover = () => confirmBtn.style.background = '#c4a5d8';
    confirmBtn.onmouseout = () => confirmBtn.style.background = '#d4b5e8';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Edit Order';
    cancelBtn.style.cssText = `
        flex: 1;
        padding: 12px;
        background: #e0e0e0;
        color: #666;
        border: none;
        border-radius: 10px;
        font-weight: bold;
        cursor: pointer;
        font-size: 1em;
        transition: all 0.3s;
    `;
    cancelBtn.onmouseover = () => cancelBtn.style.background = '#d0d0d0';
    cancelBtn.onmouseout = () => cancelBtn.style.background = '#e0e0e0';

    buttonContainer.appendChild(confirmBtn);
    buttonContainer.appendChild(cancelBtn);
    modalContent.appendChild(buttonContainer);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    confirmBtn.onclick = () => {
        modalOverlay.remove();
        const loadingOverlay = showLoadingVideo();
        submitOrderToGoogle(orderData, itemList, subtotalFormatted, total, selectedDate, loadingOverlay);
    };

    cancelBtn.onclick = () => {
        modalOverlay.remove();
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Order ✨';
    };
}

async function submitOrderToGoogle(orderData, itemList, subtotalFormatted, total, selectedDate, loadingOverlay) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify(orderData)
        });

        const planet = loadingOverlay.querySelector('.planet-loader');
        const svg = loadingOverlay.querySelector('svg');
        const loadingText = loadingOverlay.querySelector('p');
        if (planet) planet.style.display = 'none';
        if (svg) svg.style.display = 'none';
        if (loadingText) loadingText.style.display = 'none';

        const successContent = document.createElement('div');
        successContent.style.cssText = `
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 50px rgba(0, 0, 0, 0.3);
            text-align: center;
            animation: slideIn 0.5s ease-out;
        `;

        const successHTML = `
            <div style="margin-bottom: 30px;">
                <h2 style="color: #6b4e71; font-size: 2em; margin-bottom: 20px;">Yay ♡ .ᐟ.ᐟ</h2>
                <div style="background: #f0f8ff; padding: 25px; border-radius: 15px; line-height: 1.8; color: #555;">
                    <p style="margin-bottom: 15px;">Thank you for your order! We'll send you a confirmation email within a few hours—your sweet treat is almost on its way. ✧˖°</p>
                    
                    <p style="margin-bottom: 15px;">Once payment is received, we'll bake your goodies fresh with love. (If not, we'll have to cancel—and we'd be so sad to do that ˙ᵕ˙)</p>
                    
                    <p style="color: #6b4e71; font-weight: bold; margin-top: 20px;">Thank you so much for your kind understanding! ᶻ 𝗓 𐰁</p>
                </div>
            </div>

            <div style="background: #f8f8f8; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <strong style="color: #6b4e71; display: block; margin-bottom: 15px;">Order Details</strong>
                <p style="color: #666; margin: 8px 0; text-align: left;"><strong>Email:</strong> ${orderData.email}</p>
                <p style="color: #666; margin: 8px 0; text-align: left;"><strong>Phone:</strong> ${orderData.phone}</p>
                <p style="color: #666; margin: 8px 0; text-align: left;"><strong>Items:</strong> ${itemList}</p>
                <p style="color: #666; margin: 8px 0; text-align: left;"><strong>Date:</strong> ${selectedDate}</p>
                <p style="color: #666; margin: 8px 0; text-align: left;"><strong>Time:</strong> ${selectedTimeSlot}</p>
                <p style="color: #6b4e71; font-weight: bold; margin: 12px 0 0 0; text-align: left; font-size: 1.1em;"><strong>Total:</strong> ${total}</p>
            </div>
        `;

        successContent.innerHTML = successHTML;

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Back to Home ✨';
        closeBtn.style.cssText = `
            width: 100%;
            padding: 12px;
            background: #d4b5e8;
            color: #6b4e71;
            border: none;
            border-radius: 10px;
            font-weight: bold;
            cursor: pointer;
            font-size: 1em;
            transition: all 0.3s;
        `;
        closeBtn.onmouseover = () => closeBtn.style.background = '#c4a5d8';
        closeBtn.onmouseout = () => closeBtn.style.background = '#d4b5e8';
        closeBtn.onclick = () => {
            loadingOverlay.remove();
            resetForm();
            showPage('home-page');
        };

        successContent.appendChild(closeBtn);
        
        if (!document.getElementById('slideInAnimation')) {
            const style = document.createElement('style');
            style.id = 'slideInAnimation';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        loadingOverlay.style.background = 'rgba(0, 0, 0, 0.5)';
        loadingOverlay.appendChild(successContent);
        
    } catch (error) {
        console.error('Submission error:', error);
        hideLoadingVideo();
        alert('⚠️ There was an error submitting your order.\n\nPlease try again or contact us directly:\n\nName: ' + orderData.fullName + '\nEmail: ' + orderData.email + '\nPhone: ' + orderData.phone);
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Order ✨';
    }
}

document.getElementById('orderForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const totalItems = orderItems.brookie + orderItems.ubeCoconut + orderItems.ubeCheese;
    if (totalItems === 0) {
        document.getElementById('orderError').style.display = 'block';
        return;
    }
    document.getElementById('orderError').style.display = 'none';

    if (!selectedTimeSlot) {
        document.getElementById('timeError').style.display = 'block';
        return;
    }
    document.getElementById('timeError').style.display = 'none';
    
    const formData = new FormData(e.target);
    const selectedDate = formData.get('date');
    
    const subtotal = 
        orderItems.brookie * 2.99 +
        orderItems.ubeCoconut * 5.50 +
        orderItems.ubeCheese * 5.50;
    const total = (subtotal + deliveryFee).toFixed(2);
    const subtotalFormatted = subtotal.toFixed(2);
    
    let itemList = '';
    if (orderItems.brookie > 0) itemList += `Brookie Monsters x${orderItems.brookie}, `;
    if (orderItems.ubeCoconut > 0) itemList += `Ube Dream Tres Leches (Coconut Flakes) x${orderItems.ubeCoconut}, `;
    if (orderItems.ubeCheese > 0) itemList += `Ube Dream Tres Leches (Cheese) x${orderItems.ubeCheese}`;
    
    itemList = itemList.replace(/, $/, '');
    
    const orderData = {
        timestamp: new Date().toISOString(),
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        paymentMethod: formData.get('paymentMethod'),
        deliveryMethod: formData.get('deliveryMethod') === 'pickup' ? 'Pick-up' : 'Delivery',
        deliveryArea: deliveryArea || 'N/A',
        address: formData.get('address') || 'N/A',
        brookieQty: orderItems.brookie,
        ubeCoconutQty: orderItems.ubeCoconut,
        ubeCheeseQty: orderItems.ubeCheese,
        items: itemList,
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        total: total,
        date: selectedDate,
        time: selectedTimeSlot,
        specialRequests: formData.get('specialRequests') || 'None'
    };

    if (!bookedSlots[selectedDate]) {
        bookedSlots[selectedDate] = [];
    }
    bookedSlots[selectedDate].push(selectedTimeSlot);

    showConfirmationReceipt(orderData, itemList, subtotalFormatted, total, selectedDate);
});

function resetForm() {
    document.getElementById('orderForm').reset();
    orderItems.brookie = 0;
    orderItems.ubeCoconut = 0;
    orderItems.ubeCheese = 0;
    document.getElementById('qty-brookie').textContent = '0';
    document.getElementById('qty-ubeCoconut').textContent = '0';
    document.getElementById('qty-ubeCheese').textContent = '0';
    document.querySelectorAll('.menu-select-item').forEach(item => item.classList.remove('selected'));
    document.getElementById('timeSlotGroup').style.display = 'none';
    addressGroup.style.display = 'none';
    deliveryFee = 0;
    deliveryArea = '';
    selectedTimeSlot = null;
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Order ✨';
}

function setDateRestrictions() {
    const dateInput = document.getElementById('date');
    const today = new Date();
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];
    
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 3);
    const maxDateStr = maxDate.toISOString().split('T')[0];
    
    dateInput.setAttribute('min', minDate);
    dateInput.setAttribute('max', maxDateStr);
}

window.addEventListener('load', () => {
  const intro = document.getElementById('intro');
  const introVideo = document.getElementById('introVideo');

  setDateRestrictions();

  introVideo.addEventListener('ended', () => {
    intro.classList.add('slide-up');
    setTimeout(() => {
      intro.style.display = 'none';
      document.getElementById('home-page').classList.add('active');
    }, 1500);
  });
});

