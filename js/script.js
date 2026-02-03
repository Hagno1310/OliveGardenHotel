document.addEventListener('DOMContentLoaded', () => {

    // --- Smooth Scroll Logic ---
    const smoothScroll = (target, duration) => {
        const targetElement = document.querySelector(target);
        if (!targetElement) return;

        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        const ease = (t, b, c, d) => {
            t /= d;
            t--;
            return c * (t * t * t + 1) + b;
        };

        const animation = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = ease(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        };

        requestAnimationFrame(animation);
    };

    const navLinks = document.querySelectorAll('header nav a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            smoothScroll(href, 1000);
        });
    });

    // --- Cart Data Management ---
    let cart = {
        food: [],
        rooms: [],
        services: []
    };

    // Load cart from localStorage
    const loadCart = () => {
        const savedCart = localStorage.getItem('oliveGardenCart');
        if (savedCart) {
            const parsed = JSON.parse(savedCart);
            cart = {
                food: parsed.food || [],
                rooms: parsed.rooms || [],
                services: parsed.services || []
            };
        }
    };

    // Save cart to localStorage
    const saveCart = () => {
        localStorage.setItem('oliveGardenCart', JSON.stringify(cart));
    };

    // Initialize cart
    loadCart();

    // --- Cart Panel Logic ---
    const cartIcon = document.querySelector('.cart a');
    const cartOverlay = document.querySelector('.cart-overlay');
    const cartPanel = document.querySelector('.cart-panel');
    const closeCartBtn = document.querySelector('.close-cart-btn');
    const cartTabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    const openCart = () => {
        if (cartPanel && cartOverlay) {
            cartPanel.classList.add('open');
            cartOverlay.classList.add('open');
            renderCart();
        }
    };

    const closeCart = () => {
        if (cartPanel && cartOverlay) {
            cartPanel.classList.remove('open');
            cartOverlay.classList.remove('open');
        }
    };

    if (cartIcon) {
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            openCart();
        });
    }

    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', closeCart);
    }

    if (cartOverlay) {
        cartOverlay.addEventListener('click', closeCart);
    }

    cartTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all tabs and content
            cartTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Activate the clicked tab and corresponding content
            tab.classList.add('active');
            const targetContent = document.getElementById(tab.dataset.tab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // --- Switch to specific tab ---
    const switchToTab = (tabName) => {
        const tabs = document.querySelectorAll('.tab-link');
        const contents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            }
        });

        contents.forEach(content => {
            content.classList.remove('active');
            if (content.id === tabName) {
                content.classList.add('active');
            }
        });
    };

    // --- Add Food to Cart ---
    const addFoodToCart = (id, name, price) => {
        const existingItem = cart.food.find(item => item.id === id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.food.push({
                id: id,
                name: name,
                price: parseFloat(price),
                quantity: 1
            });
        }
        saveCart();
        renderCart();
        switchToTab('cart-food');
        openCart();
        showNotification(`${name} added to cart!`);
    };

    // --- Add Room to Cart ---
    const addRoomToCart = (id, name, price, nights = 1) => {
        const existingRoom = cart.rooms.find(item => item.id === id);
        if (existingRoom) {
            existingRoom.nights += nights;
        } else {
            cart.rooms.push({
                id: id,
                name: name,
                price: parseFloat(price),
                nights: nights
            });
        }
        saveCart();
        renderCart();
        switchToTab('cart-rooms');
        openCart();
        showNotification(`${name} booked for ${nights} night(s)!`);
    };

    // --- Add Service to Cart ---
    const addServiceToCart = (id, name, price) => {
        // Ensure services array exists
        if (!cart.services) cart.services = [];

        const existingService = cart.services.find(item => item.id === id);
        if (existingService) {
            existingService.quantity += 1;
        } else {
            cart.services.push({
                id: id,
                name: name,
                price: parseFloat(price),
                quantity: 1
            });
        }
        saveCart();
        renderCart();
        switchToTab('cart-services');
        openCart();
        showNotification(`${name} added to cart!`);
    };

    // --- Remove Item from Cart ---
    const removeFromCart = (type, id) => {
        if (type === 'food') {
            cart.food = cart.food.filter(item => item.id !== id);
        } else if (type === 'rooms') {
            cart.rooms = cart.rooms.filter(item => item.id !== id);
        } else if (type === 'services') {
            cart.services = cart.services.filter(item => item.id !== id);
        }
        saveCart();
        renderCart();
    };

    // --- Update Quantity ---
    const updateQuantity = (type, id, delta) => {
        if (type === 'food') {
            const item = cart.food.find(item => item.id === id);
            if (item) {
                item.quantity += delta;
                if (item.quantity <= 0) {
                    removeFromCart('food', id);
                    return;
                }
            }
        } else if (type === 'rooms') {
            const item = cart.rooms.find(item => item.id === id);
            if (item) {
                item.nights += delta;
                if (item.nights <= 0) {
                    removeFromCart('rooms', id);
                    return;
                }
            }
        } else if (type === 'services') {
            const item = cart.services.find(item => item.id === id);
            if (item) {
                item.quantity += delta;
                if (item.quantity <= 0) {
                    removeFromCart('services', id);
                    return;
                }
            }
        }
        saveCart();
        renderCart();
    };

    // --- Calculate Total ---
    const calculateTotal = () => {
        let total = 0;
        cart.food.forEach(item => {
            total += item.price * item.quantity;
        });
        cart.rooms.forEach(item => {
            total += item.price * item.nights;
        });
        cart.services.forEach(item => {
            total += item.price * item.quantity;
        });
        return total.toFixed(2);
    };

    // --- Render Cart ---
    const renderCart = () => {
        const foodContainer = document.getElementById('cart-food');
        const roomsContainer = document.getElementById('cart-rooms');
        const totalPrice = document.getElementById('cart-total-price');

        // Render Food Items
        if (foodContainer) {
            if (cart.food.length === 0) {
                foodContainer.innerHTML = '<p class="cart-empty">Your food cart is empty.</p>';
            } else {
                foodContainer.innerHTML = cart.food.map(item => `
                    <div class="cart-item" data-id="${item.id}">
                        <div class="cart-item-info">
                            <h4>${item.name}</h4>
                            <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                        </div>
                        <div class="cart-item-controls">
                            <button class="qty-btn minus" data-type="food" data-id="${item.id}">-</button>
                            <span class="qty-value">${item.quantity}</span>
                            <button class="qty-btn plus" data-type="food" data-id="${item.id}">+</button>
                        </div>
                        <button class="remove-btn" data-type="food" data-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('');
            }
        }

        // Render Room Bookings
        if (roomsContainer) {
            if (cart.rooms.length === 0) {
                roomsContainer.innerHTML = '<p class="cart-empty">You have no rooms booked.</p>';
            } else {
                roomsContainer.innerHTML = cart.rooms.map(item => `
                    <div class="cart-item" data-id="${item.id}">
                        <div class="cart-item-info">
                            <h4>${item.name}</h4>
                            <p class="cart-item-price">$${item.price.toFixed(2)} / night</p>
                        </div>
                        <div class="cart-item-controls">
                            <button class="qty-btn minus" data-type="rooms" data-id="${item.id}">-</button>
                            <span class="qty-value">${item.nights} night${item.nights > 1 ? 's' : ''}</span>
                            <button class="qty-btn plus" data-type="rooms" data-id="${item.id}">+</button>
                        </div>
                        <button class="remove-btn" data-type="rooms" data-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('');
            }
        }

        // Render Services
        const servicesContainer = document.getElementById('cart-services');
        if (servicesContainer) {
            if (cart.services.length === 0) {
                servicesContainer.innerHTML = '<p class="cart-empty">You have no services booked.</p>';
            } else {
                servicesContainer.innerHTML = cart.services.map(item => `
                    <div class="cart-item" data-id="${item.id}">
                        <div class="cart-item-info">
                            <h4>${item.name}</h4>
                            <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                        </div>
                        <div class="cart-item-controls">
                            <button class="qty-btn minus" data-type="services" data-id="${item.id}">-</button>
                            <span class="qty-value">${item.quantity}</span>
                            <button class="qty-btn plus" data-type="services" data-id="${item.id}">+</button>
                        </div>
                        <button class="remove-btn" data-type="services" data-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('');
            }
        }

        // Update Total
        if (totalPrice) {
            totalPrice.textContent = `$${calculateTotal()}`;
        }

        // Update cart badge
        updateCartBadge();

        // Attach event listeners to cart controls
        attachCartEventListeners();
    };

    // --- Attach Event Listeners to Cart Items ---
    const attachCartEventListeners = () => {
        // Quantity buttons
        document.querySelectorAll('.qty-btn.minus').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                const id = btn.dataset.id;
                updateQuantity(type, id, -1);
            });
        });

        document.querySelectorAll('.qty-btn.plus').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                const id = btn.dataset.id;
                updateQuantity(type, id, 1);
            });
        });

        // Remove buttons
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                const id = btn.dataset.id;
                removeFromCart(type, id);
            });
        });
    };

    // --- Update Cart Badge ---
    const updateCartBadge = () => {
        const cartIconContainer = document.querySelector('.cart');
        if (!cartIconContainer) return;

        let badge = cartIconContainer.querySelector('.cart-badge');
        const totalItems = cart.food.reduce((sum, item) => sum + item.quantity, 0) +
                          cart.rooms.reduce((sum, item) => sum + item.nights, 0) +
                          cart.services.reduce((sum, item) => sum + item.quantity, 0);

        if (totalItems > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'cart-badge';
                cartIconContainer.appendChild(badge);
            }
            badge.textContent = totalItems;
        } else if (badge) {
            badge.remove();
        }
    };

    // --- Show Notification ---
    const showNotification = (message) => {
        // Remove existing notification
        const existingNotification = document.querySelector('.cart-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    };

    // --- Event Listeners for Adding Items ---

    // Food items (Order Now buttons)
    document.querySelectorAll('.btn-add-food').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const card = btn.closest('.menu-item-card');
            if (card) {
                const id = card.dataset.itemId;
                const name = card.dataset.itemName;
                const price = card.dataset.itemPrice;
                addFoodToCart(id, name, price);
            }
        });
    });

    // Room bookings (Book Room buttons)
    document.querySelectorAll('.btn-book-room').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const card = btn.closest('.room-card');
            if (card) {
                const id = card.dataset.roomId;
                const name = card.dataset.roomName;
                const price = card.dataset.roomPrice;
                addRoomToCart(id, name, price, 1);
            }
        });
    });

    // Service bookings (Book Service buttons)
    document.querySelectorAll('.btn-book-service').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const serviceItem = btn.closest('.service-item');
            if (serviceItem) {
                const id = serviceItem.dataset.serviceId;
                const name = serviceItem.dataset.serviceName;
                const price = serviceItem.dataset.servicePrice;
                addServiceToCart(id, name, price);
            }
        });
    });

    // --- Checkout Modal Functions ---
    const showCheckoutModal = () => {
        const foodTotal = cart.food.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const roomsTotal = cart.rooms.reduce((sum, item) => sum + (item.price * item.nights), 0);
        const servicesTotal = cart.services.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const grandTotal = foodTotal + roomsTotal + servicesTotal;

        let foodItemsHTML = '';
        let roomItemsHTML = '';
        let servicesItemsHTML = '';

        if (cart.food.length > 0) {
            foodItemsHTML = `
                <div class="checkout-section food">
                    <div class="checkout-section-title">
                        <i class="fas fa-utensils"></i> Food Orders
                    </div>
                    ${cart.food.map(item => `
                        <div class="checkout-item">
                            <span class="checkout-item-name">${item.name}</span>
                            <span class="checkout-item-qty">x${item.quantity}</span>
                            <span class="checkout-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                    <div class="checkout-subtotal">
                        <span>Subtotal</span>
                        <span>$${foodTotal.toFixed(2)}</span>
                    </div>
                </div>
            `;
        }

        if (cart.rooms.length > 0) {
            roomItemsHTML = `
                <div class="checkout-section rooms">
                    <div class="checkout-section-title">
                        <i class="fas fa-bed"></i> Room Bookings
                    </div>
                    ${cart.rooms.map(item => `
                        <div class="checkout-item">
                            <span class="checkout-item-name">${item.name}</span>
                            <span class="checkout-item-qty">${item.nights} night${item.nights > 1 ? 's' : ''}</span>
                            <span class="checkout-item-price">$${(item.price * item.nights).toFixed(2)}</span>
                        </div>
                    `).join('')}
                    <div class="checkout-subtotal">
                        <span>Subtotal</span>
                        <span>$${roomsTotal.toFixed(2)}</span>
                    </div>
                </div>
            `;
        }

        if (cart.services.length > 0) {
            servicesItemsHTML = `
                <div class="checkout-section services">
                    <div class="checkout-section-title">
                        <i class="fas fa-spa"></i> Services
                    </div>
                    ${cart.services.map(item => `
                        <div class="checkout-item">
                            <span class="checkout-item-name">${item.name}</span>
                            <span class="checkout-item-qty">x${item.quantity}</span>
                            <span class="checkout-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                    <div class="checkout-subtotal">
                        <span>Subtotal</span>
                        <span>$${servicesTotal.toFixed(2)}</span>
                    </div>
                </div>
            `;
        }

        const modalHTML = `
            <div class="checkout-modal-overlay" id="checkoutModal">
                <div class="checkout-modal">
                    <div class="checkout-modal-header">
                        <h3><i class="fas fa-receipt"></i> Order Summary</h3>
                        <p>Please review your order before confirming</p>
                    </div>
                    <div class="checkout-modal-body">
                        ${foodItemsHTML}
                        ${roomItemsHTML}
                        ${servicesItemsHTML}
                    </div>
                    <div class="checkout-modal-footer">
                        <div class="checkout-total">
                            <span>Grand Total</span>
                            <span>$${grandTotal.toFixed(2)}</span>
                        </div>
                        <div class="checkout-modal-buttons">
                            <button class="checkout-btn-cancel" id="cancelCheckout">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                            <button class="checkout-btn-confirm" id="confirmCheckout">
                                <i class="fas fa-check"></i> Confirm
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        setTimeout(() => {
            document.getElementById('checkoutModal').classList.add('show');
        }, 10);

        // Event listeners for modal buttons
        document.getElementById('cancelCheckout').addEventListener('click', closeCheckoutModal);
        document.getElementById('confirmCheckout').addEventListener('click', confirmCheckout);
        document.getElementById('checkoutModal').addEventListener('click', (e) => {
            if (e.target.id === 'checkoutModal') {
                closeCheckoutModal();
            }
        });
    };

    const closeCheckoutModal = () => {
        const modal = document.getElementById('checkoutModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    };

    const showSuccessModal = () => {
        const modalHTML = `
            <div class="checkout-modal-overlay" id="successModal">
                <div class="checkout-modal">
                    <div class="success-modal">
                        <div class="success-icon">
                            <i class="fas fa-check"></i>
                        </div>
                        <h3>Order Successful!</h3>
                        <p>Thank you for your order. We'll prepare everything for you. Have a wonderful stay at Olive Garden Hotel!</p>
                        <button class="success-btn" id="closeSuccessModal">
                            <i class="fas fa-thumbs-up"></i> Great!
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        setTimeout(() => {
            document.getElementById('successModal').classList.add('show');
        }, 10);

        document.getElementById('closeSuccessModal').addEventListener('click', closeSuccessModal);
        document.getElementById('successModal').addEventListener('click', (e) => {
            if (e.target.id === 'successModal') {
                closeSuccessModal();
            }
        });
    };

    const closeSuccessModal = () => {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    };

    const confirmCheckout = () => {
        closeCheckoutModal();

        // Clear cart after checkout
        cart = { food: [], rooms: [], services: [] };
        saveCart();
        renderCart();
        closeCart();

        // Show success modal
        setTimeout(() => {
            showSuccessModal();
        }, 300);
    };

    // --- Checkout Button ---
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.food.length === 0 && cart.rooms.length === 0 && cart.services.length === 0) {
                showNotification('Your cart is empty!');
                return;
            }
            showCheckoutModal();
        });
    }

    // Initialize cart badge and render on page load
    updateCartBadge();
});
