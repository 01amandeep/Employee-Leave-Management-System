// Core Application Logic for ElixHR Leave Management System

// Global Application State
let currentUser = null;
let currentYear = 2026;
let currentMonth = 6; // 0-indexed, so 6 is July

const SYSTEM_TODAY_STR = '2026-07-02';
const SYSTEM_TODAY = new Date(SYSTEM_TODAY_STR);

// Predefined list of months
const MONTHS_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

document.addEventListener('DOMContentLoaded', () => {
  // Initialize state
  currentUser = ELMS_Store.getCurrentUser();
  
  // Set up event listeners
  initNavigation();
  initRoleSwitcher();
  initLeaveRequestForm();
  initModals();
  initCalendarControls();
  
  // Initial Render
  renderApp();
  
  // Start clock display
  updateClock();
});

// Update the top header date display
function updateClock() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = SYSTEM_TODAY.toLocaleDateString('en-US', options);
  document.getElementById('current-date-display').textContent = dateStr;
}

// NAVIGATION & ROUTING
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-menu .nav-item');
  const sections = document.querySelectorAll('.page-section');
  const headerActionBtn = document.getElementById('btn-header-action');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetSectionId = item.getAttribute('data-target');
      navigateToSection(targetSectionId);
    });
  });

  headerActionBtn.addEventListener('click', () => {
    if (currentUser.role === 'HR Admin') {
      // Admin quick action: manage balances
      navigateToSection('balances');
    } else {
      // Employee quick action: request leave
      navigateToSection('request-leave');
    }
  });

  // Cancel buttons in forms redirecting to dashboard
  document.getElementById('btn-cancel-request').addEventListener('click', () => {
    navigateToSection('dashboard');
  });
}

function navigateToSection(sectionId) {
  // Update sidebar active state
  const navItems = document.querySelectorAll('.nav-menu .nav-item');
  navItems.forEach(item => {
    if (item.getAttribute('data-target') === sectionId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // If sectionId is "dashboard", route to correct dashboard based on role
  let targetId = sectionId;
  if (sectionId === 'dashboard') {
    targetId = currentUser.role === 'HR Admin' ? 'section-admin-dashboard' : 'section-employee-dashboard';
  } else {
    targetId = `section-${sectionId}`;
  }

  // Show/Hide Page Sections
  const sections = document.querySelectorAll('.page-section');
  sections.forEach(sec => {
    if (sec.id === targetId) {
      sec.classList.add('active');
    } else {
      sec.classList.remove('active');
    }
  });

  // Re-render the specific section to ensure fresh data
  if (sectionId === 'dashboard') {
    if (currentUser.role === 'HR Admin') {
      renderAdminDashboard();
    } else {
      renderEmployeeDashboard();
    }
  } else if (sectionId === 'calendar') {
    renderCalendar();
  } else if (sectionId === 'analytics') {
    renderAnalytics();
  } else if (sectionId === 'balances') {
    renderBalancesSection();
  }
}

// ROLE & USER SWITCHER
function initRoleSwitcher() {
  const switchBtn = document.getElementById('btn-switch-role');
  const switchModal = document.getElementById('modal-switch-user');
  const userListContainer = document.getElementById('switch-user-list');

  switchBtn.addEventListener('click', () => {
    // Populate users in modal
    const employees = ELMS_Store.getEmployees();
    userListContainer.innerHTML = '';

    employees.forEach(emp => {
      const isCurrent = emp.id === currentUser.id;
      const userItem = document.createElement('div');
      userItem.className = 'balance-card';
      userItem.style.cursor = 'pointer';
      userItem.style.border = isCurrent ? '1px solid var(--color-primary)' : 'var(--glass-border)';
      userItem.style.background = isCurrent ? 'var(--color-primary-light)' : 'rgba(255, 255, 255, 0.02)';
      
      userItem.innerHTML = `
        <div class="user-avatar" style="background-color: ${emp.avatarBg}">${getInitials(emp.name)}</div>
        <div class="user-info" style="flex: 1;">
          <span class="user-name">${emp.name}</span>
          <span class="user-role-badge">${emp.role} • ${emp.department}</span>
        </div>
        ${isCurrent ? '<span style="font-size:0.75rem; color:var(--color-primary); font-weight:700;">Active</span>' : ''}
      `;

      userItem.addEventListener('click', () => {
        selectUser(emp);
        closeModal('modal-switch-user');
      });

      userListContainer.appendChild(userItem);
    });

    openModal('modal-switch-user');
  });
}

function selectUser(user) {
  currentUser = user;
  ELMS_Store.setCurrentUser(user);
  
  // Show login notification
  showToast(`Switched to ${user.name} (${user.role})`, 'info');
  
  // Full App Re-render
  renderApp();
  
  // Default to main dashboard on role switch
  navigateToSection('dashboard');
}

// RENDERING ENGINE
function renderApp() {
  // Update header greetings
  const firstName = currentUser.name.split(' ')[0];
  document.getElementById('greeting-text').textContent = `Welcome back, ${firstName}`;
  
  if (currentUser.role === 'HR Admin') {
    document.getElementById('greeting-subtext').textContent = "HR Administration Dashboard. Manage team leaves.";
    document.getElementById('header-action-text').textContent = "Adjust Allocations";
    // Adjust sidebar tabs availability
    document.getElementById('nav-request-leave').style.display = 'none';
    document.getElementById('nav-analytics').style.display = 'block';
    document.getElementById('nav-balances').style.display = 'block';
  } else {
    document.getElementById('greeting-subtext').textContent = "Employee Portal. View leave balances and request time off.";
    document.getElementById('header-action-text').textContent = "Apply for Leave";
    // Adjust sidebar tabs availability
    document.getElementById('nav-request-leave').style.display = 'block';
    document.getElementById('nav-analytics').style.display = 'none';
    document.getElementById('nav-balances').style.display = 'none';
  }

  // Update sidebar user card
  const avatarEl = document.getElementById('current-user-avatar');
  avatarEl.textContent = getInitials(currentUser.name);
  avatarEl.style.backgroundColor = currentUser.avatarBg;
  document.getElementById('current-user-name').textContent = currentUser.name;
  document.getElementById('current-user-role').textContent = currentUser.role;

  // Render appropriate views
  if (currentUser.role === 'HR Admin') {
    renderAdminDashboard();
  } else {
    renderEmployeeDashboard();
  }
}

// EMPLOYEE VIEW RENDERING
function renderEmployeeDashboard() {
  const container = document.getElementById('employee-balance-cards');
  container.innerHTML = '';

  // Get fresh employee copy from store to ensure updated balances
  const employees = ELMS_Store.getEmployees();
  const currentEmp = employees.find(e => e.id === currentUser.id) || currentUser;

  const leaveTypes = [
    { key: 'casual', label: 'Casual Leave', color: 'var(--color-pending)' },
    { key: 'medical', label: 'Medical Leave', color: 'var(--color-approved)' },
    { key: 'paid', label: 'Paid Leave', color: '#c084fc' }
  ];

  leaveTypes.forEach(type => {
    const bal = currentEmp.leaveBalances[type.key];
    const remaining = bal.allocated - bal.used;
    const percentage = bal.allocated > 0 ? Math.round((remaining / bal.allocated) * 100) : 0;
    
    // SVG Dash Array Calculations
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    const card = document.createElement('div');
    card.className = 'glass-card balance-card';
    card.innerHTML = `
      <div class="balance-ring" style="--ring-color: ${type.color}">
        <svg>
          <circle class="bg" cx="30" cy="30" r="${radius}"></circle>
          <circle class="progress" cx="30" cy="30" r="${radius}" 
                  stroke-dasharray="${circumference}" 
                  stroke-dashoffset="${offset}"></circle>
        </svg>
        <span class="percentage">${percentage}%</span>
      </div>
      <div class="balance-info">
        <span class="balance-type">${type.label}</span>
        <span class="balance-count">${remaining} <span style="font-size:0.8rem; font-weight:normal; color:var(--text-secondary);">days left</span></span>
        <span class="balance-total">Allocated: ${bal.allocated} days</span>
      </div>
    `;
    container.appendChild(card);
  });

  // Render Leave History Table
  const tbody = document.getElementById('employee-leaves-tbody');
  tbody.innerHTML = '';

  const leaves = ELMS_Store.getLeaves().filter(l => l.employeeId === currentUser.id);

  if (leaves.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted);">No leave requests found.</td></tr>`;
    return;
  }

  leaves.forEach(leave => {
    const tr = document.createElement('tr');
    
    // Action column: only show cancel button for pending requests
    const actionCell = leave.status === 'Pending' 
      ? `<button class="btn btn-danger btn-sm" onclick="cancelLeave('${leave.id}')">Cancel</button>`
      : '<span style="color:var(--text-muted); font-size:0.8rem;">—</span>';

    tr.innerHTML = `
      <td><span class="leave-type-badge">${leave.leaveType}</span></td>
      <td>${formatDate(leave.startDate)}</td>
      <td>${formatDate(leave.endDate)}</td>
      <td style="font-weight:600;">${leave.duration} ${leave.duration === 1 ? 'day' : 'days'}</td>
      <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${leave.reason}">${leave.reason}</td>
      <td><span class="status-badge ${leave.status.toLowerCase()}">${leave.status}</span></td>
      <td style="font-size:0.85rem; color:var(--text-secondary); max-width:200px;">${leave.hrComment || '<span style="color:var(--text-muted);">No comment</span>'}</td>
      <td>${actionCell}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Global scope access wrapper for onclick cancellation
window.cancelLeave = function(leaveId) {
  try {
    if (confirm('Are you sure you want to cancel this pending leave request?')) {
      ELMS_Store.cancelLeaveRequest(leaveId);
      showToast('Leave request cancelled successfully.', 'success');
      renderEmployeeDashboard();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// HR ADMIN VIEW RENDERING
function renderAdminDashboard() {
  const leaves = ELMS_Store.getLeaves();
  const employees = ELMS_Store.getEmployees();

  // 1. Calculate Stats
  const totalEmployees = employees.length;
  const pendingApprovals = leaves.filter(l => l.status === 'Pending').length;
  
  // On leave calculations (approved leaves spanning today 2026-07-02)
  const currentlyOnLeave = leaves.filter(l => {
    if (l.status !== 'Approved') return false;
    const start = new Date(l.startDate);
    const end = new Date(l.endDate);
    return SYSTEM_TODAY >= start && SYSTEM_TODAY <= end;
  }).length;

  const totalApproved = leaves.filter(l => l.status === 'Approved').length;

  const statsGrid = document.getElementById('admin-stats-grid');
  statsGrid.innerHTML = `
    <div class="glass-card stat-card" style="--accent: var(--color-primary)">
      <div class="stat-header">
        <span>Total Staff</span>
        <div class="stat-icon">
          <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
        </div>
      </div>
      <div class="stat-value">${totalEmployees}</div>
      <div class="stat-footer">Active profiles registered</div>
    </div>

    <div class="glass-card stat-card" style="--accent: var(--color-pending)">
      <div class="stat-header">
        <span>Pending Approvals</span>
        <div class="stat-icon" style="background:var(--color-pending-light);">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        </div>
      </div>
      <div class="stat-value">${pendingApprovals}</div>
      <div class="stat-footer">Requires HR decision</div>
    </div>

    <div class="glass-card stat-card" style="--accent: var(--color-approved)">
      <div class="stat-header">
        <span>Currently On Leave</span>
        <div class="stat-icon" style="background:var(--color-approved-light);">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        </div>
      </div>
      <div class="stat-value">${currentlyOnLeave}</div>
      <div class="stat-footer">Out of office today</div>
    </div>

    <div class="glass-card stat-card" style="--accent: #c084fc">
      <div class="stat-header">
        <span>Leaves Approved</span>
        <div class="stat-icon" style="background:rgba(192, 132, 252, 0.15);">
          <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
      </div>
      <div class="stat-value">${totalApproved}</div>
      <div class="stat-footer">Processed applications</div>
    </div>
  `;

  // 2. Render Pending Approvals Grid
  const pendingContainer = document.getElementById('admin-pending-approvals');
  pendingContainer.innerHTML = '';
  
  const pendingRequests = leaves.filter(l => l.status === 'Pending');

  if (pendingRequests.length === 0) {
    pendingContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: rgba(255,255,255,0.01); border-radius: var(--border-radius-md); border: var(--glass-border); color: var(--text-muted);">
        All leave requests have been processed! No pending actions.
      </div>
    `;
  } else {
    pendingRequests.forEach(req => {
      const emp = employees.find(e => e.id === req.employeeId) || {};
      
      const card = document.createElement('div');
      card.className = 'glass-card approval-card';
      card.innerHTML = `
        <div class="approval-card-header">
          <div class="user-avatar" style="background-color: ${emp.avatarBg || '#777'}">${getInitials(req.employeeName)}</div>
          <div>
            <div class="user-name">${req.employeeName}</div>
            <div style="font-size:0.75rem; color:var(--text-secondary);">${emp.department || ''} • Balance: ${getEmployeeRemainingBalance(emp, req.leaveType)} days</div>
          </div>
        </div>
        
        <div class="approval-card-details">
          <div class="detail-row">
            <span class="detail-label">Type</span>
            <span class="leave-type-badge">${req.leaveType}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Duration</span>
            <span class="detail-value">${req.duration} days (${formatDate(req.startDate)} to ${formatDate(req.endDate)})</span>
          </div>
          <div style="border-top:1px solid rgba(255,255,255,0.05); padding-top:10px; margin-top:4px;">
            <span class="detail-label">Reason:</span>
            <p class="approval-reason">"${req.reason}"</p>
          </div>
        </div>
        
        <div class="approval-actions">
          <button class="btn btn-danger btn-sm" style="flex:1;" onclick="openRejectionDialog('${req.id}')">Reject</button>
          <button class="btn btn-primary btn-sm" style="flex:1; background:var(--color-approved);" onclick="approveLeave('${req.id}')">Approve</button>
        </div>
      `;
      pendingContainer.appendChild(card);
    });
  }

  // 3. Render Decisions/Decision history Table
  const decisionsTbody = document.getElementById('admin-decisions-tbody');
  decisionsTbody.innerHTML = '';
  
  const processedLeaves = leaves.filter(l => l.status !== 'Pending');

  if (processedLeaves.length === 0) {
    decisionsTbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">No leave decisions logged yet.</td></tr>`;
    return;
  }

  processedLeaves.forEach(leave => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:600;">${leave.employeeName}</td>
      <td><span class="leave-type-badge">${leave.leaveType}</span></td>
      <td style="font-size:0.85rem;">${formatDate(leave.startDate)} - ${formatDate(leave.endDate)}</td>
      <td style="font-weight:600;">${leave.duration} days</td>
      <td style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${leave.reason}">${leave.reason}</td>
      <td><span class="status-badge ${leave.status.toLowerCase()}">${leave.status}</span></td>
      <td style="font-size:0.85rem; color:var(--text-secondary); max-width:180px;">${leave.hrComment || '<span style="color:var(--text-muted);">No comment</span>'}</td>
    `;
    decisionsTbody.appendChild(tr);
  });
}

// Global actions for leaves processing
window.approveLeave = function(leaveId) {
  try {
    ELMS_Store.updateLeaveStatus(leaveId, 'Approved');
    showToast('Leave request approved successfully!', 'success');
    fireConfetti();
    renderAdminDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

let activeRejectionLeaveId = null;

window.openRejectionDialog = function(leaveId) {
  activeRejectionLeaveId = leaveId;
  document.getElementById('rejection-comment').value = '';
  openModal('modal-rejection-remark');
};

function initModals() {
  // Setup standard close buttons on modals
  const closeModalBtns = document.querySelectorAll('.modal-close, .btn-secondary');
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-overlay');
      if (modal) {
        closeModal(modal.id);
      }
    });
  });

  // Rejection remark form submit
  document.getElementById('rejection-remark-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const comment = document.getElementById('rejection-comment').value;
    
    if (activeRejectionLeaveId && comment.trim()) {
      try {
        ELMS_Store.updateLeaveStatus(activeRejectionLeaveId, 'Rejected', comment);
        showToast('Leave request rejected.', 'error');
        closeModal('modal-rejection-remark');
        renderAdminDashboard();
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  });

  // Adjust balance form submit
  document.getElementById('adjust-balance-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const empId = document.getElementById('adjust-emp-id').value;
    const type = document.getElementById('adjust-leave-type').value;
    const limit = document.getElementById('adjust-new-allocated').value;

    try {
      ELMS_Store.updateEmployeeBalance(empId, type, limit);
      showToast('Leave allocation adjusted successfully.', 'success');
      closeModal('modal-adjust-balance');
      renderBalancesSection();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

// FORM VALIDATION & INTERACTION
function initLeaveRequestForm() {
  const form = document.getElementById('leave-request-form');
  const typeSelect = document.getElementById('request-leave-type');
  const startInput = document.getElementById('request-start-date');
  const endInput = document.getElementById('request-end-date');
  
  // Real-time calculation fields
  const calcContainer = document.getElementById('request-days-calc');
  const calcDurationDays = document.getElementById('calc-duration-days');
  const calcRemainingBal = document.getElementById('calc-remaining-balance');

  // Set min date to today for future requests
  // Set date format: YYYY-MM-DD
  const minDateStr = SYSTEM_TODAY_STR;
  startInput.min = minDateStr;
  endInput.min = minDateStr;

  function updateFormCalculations() {
    const start = startInput.value;
    const end = endInput.value;
    const type = typeSelect.value;

    if (start && end) {
      const duration = window.calculateDuration(start, end);
      const employees = ELMS_Store.getEmployees();
      const emp = employees.find(e => e.id === currentUser.id);
      
      const bal = emp.leaveBalances[type];
      const remaining = bal.allocated - bal.used;

      calcDurationDays.textContent = `${duration} ${duration === 1 ? 'Working Day' : 'Working Days'}`;
      calcRemainingBal.textContent = `${remaining} Days`;

      if (duration <= 0) {
        calcDurationDays.style.color = 'var(--color-rejected)';
        calcContainer.style.display = 'block';
      } else if (duration > remaining) {
        calcDurationDays.style.color = 'var(--color-rejected)';
        calcContainer.style.display = 'block';
      } else {
        calcDurationDays.style.color = 'var(--color-approved)';
        calcContainer.style.display = 'block';
      }
    } else {
      calcContainer.style.display = 'none';
    }
  }

  startInput.addEventListener('change', (e) => {
    endInput.min = e.target.value;
    updateFormCalculations();
  });
  endInput.addEventListener('change', updateFormCalculations);
  typeSelect.addEventListener('change', updateFormCalculations);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = typeSelect.value;
    const start = startInput.value;
    const end = endInput.value;
    const reason = document.getElementById('request-reason').value;

    try {
      ELMS_Store.addLeaveRequest(currentUser.id, type, start, end, reason);
      showToast('Leave request submitted successfully!', 'success');
      form.reset();
      calcContainer.style.display = 'none';
      
      // Redirect to dashboard and refresh
      navigateToSection('dashboard');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// TEAM PLANNER CALENDAR GENERATION
function initCalendarControls() {
  document.getElementById('btn-prev-month').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
  });

  document.getElementById('btn-next-month').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
  });
}

function renderCalendar() {
  const monthTitle = document.getElementById('calendar-month-year');
  monthTitle.textContent = `${MONTHS_NAMES[currentMonth]} ${currentYear}`;

  const thead = document.getElementById('calendar-thead');
  const tbody = document.getElementById('calendar-tbody');
  
  // Calculate days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // 1. Render Header Row
  let headerHtml = `<tr><th class="employee-col">Team Member</th>`;
  for (let day = 1; day <= daysInMonth; day++) {
    const tempDate = new Date(currentYear, currentMonth, day);
    const dayOfWeek = tempDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayName = tempDate.toLocaleDateString('en-US', { weekday: 'narrow' });
    
    headerHtml += `
      <th class="calendar-day-header ${isWeekend ? 'weekend' : ''}">
        <div>${day}</div>
        <div style="font-size: 0.6rem; opacity:0.6; margin-top:2px;">${dayName}</div>
      </th>
    `;
  }
  headerHtml += `</tr>`;
  thead.innerHTML = headerHtml;

  // 2. Render Employee Rows
  const employees = ELMS_Store.getEmployees();
  const leaves = ELMS_Store.getLeaves();
  
  tbody.innerHTML = '';
  
  employees.forEach(emp => {
    const tr = document.createElement('tr');
    
    // Employee name cell sticky col
    let rowHtml = `
      <td class="employee-col">
        <div class="calendar-emp-cell">
          <div class="user-avatar" style="width:28px; height:28px; font-size:0.75rem; background-color:${emp.avatarBg}">${getInitials(emp.name)}</div>
          <div>
            <div class="calendar-emp-name">${emp.name}</div>
            <div class="calendar-emp-dept">${emp.department}</div>
          </div>
        </div>
      </td>
    `;

    // Loop days
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const cellDate = new Date(cellDateStr);
      const dayOfWeek = cellDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Check if employee has any approved leave spanning this date
      const activeLeave = leaves.find(l => {
        if (l.employeeId !== emp.id || l.status !== 'Approved') return false;
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        return cellDate >= start && cellDate <= end;
      });

      if (activeLeave) {
        rowHtml += `
          <td class="calendar-cell on-leave ${isWeekend ? 'weekend' : ''}" title="${emp.name}: Approved ${activeLeave.leaveType} leave">
            <div class="leave-bar ${activeLeave.leaveType}">${activeLeave.leaveType.charAt(0).toUpperCase()}</div>
          </td>
        `;
      } else {
        rowHtml += `<td class="calendar-cell ${isWeekend ? 'weekend' : ''}"></td>`;
      }
    }
    
    tr.innerHTML = rowHtml;
    tbody.appendChild(tr);
  });
}

// ANALYTICS RENDER
function renderAnalytics() {
  const leaves = ELMS_Store.getLeaves().filter(l => l.status === 'Approved');
  
  let casualDays = 0;
  let medicalDays = 0;
  let paidDays = 0;

  leaves.forEach(l => {
    if (l.leaveType === 'casual') casualDays += l.duration;
    else if (l.leaveType === 'medical') medicalDays += l.duration;
    else if (l.leaveType === 'paid') paidDays += l.duration;
  });

  const totalDays = casualDays + medicalDays + paidDays;
  const maxDays = Math.max(casualDays, medicalDays, paidDays, 1);

  // Render bars
  const barsContainer = document.getElementById('analytics-chart-bars');
  
  const categories = [
    { key: 'casual', value: casualDays, label: 'Casual' },
    { key: 'medical', value: medicalDays, label: 'Medical' },
    { key: 'paid', value: paidDays, label: 'Paid Leave' }
  ];

  barsContainer.innerHTML = '';
  categories.forEach(cat => {
    const heightPercent = totalDays > 0 ? (cat.value / maxDays) * 80 + 5 : 5; // offset for minimum height
    
    const barGroup = document.createElement('div');
    barGroup.className = 'chart-bar-group';
    barGroup.innerHTML = `
      <div class="chart-bar ${cat.key}" style="height: ${heightPercent}%;" data-value="${cat.value}"></div>
      <div class="chart-label">${cat.label}</div>
    `;
    barsContainer.appendChild(barGroup);
  });

  // Render Legend list
  const legend = document.getElementById('analytics-legend');
  legend.innerHTML = `
    <div class="legend-item">
      <div class="legend-info">
        <div class="legend-color" style="background:var(--color-pending)"></div>
        <span>Total Casual Leave Days</span>
      </div>
      <span class="legend-value">${casualDays} days</span>
    </div>
    <div class="legend-item">
      <div class="legend-info">
        <div class="legend-color" style="background:var(--color-approved)"></div>
        <span>Total Medical Leave Days</span>
      </div>
      <span class="legend-value">${medicalDays} days</span>
    </div>
    <div class="legend-item">
      <div class="legend-info">
        <div class="legend-color" style="background:#c084fc"></div>
        <span>Total Paid Leave Days</span>
      </div>
      <span class="legend-value">${paidDays} days</span>
    </div>
    <hr style="border:none; border-top:1px dashed rgba(255,255,255,0.08); margin:8px 0;">
    <div class="legend-item" style="font-weight:700;">
      <div class="legend-info">
        <span>Company Leave Footprint</span>
      </div>
      <span>${totalDays} days</span>
    </div>
  `;
}

// BALANCES SECTION (HR ALLOCATIONS)
function renderBalancesSection() {
  const employees = ELMS_Store.getEmployees();
  const tbody = document.getElementById('admin-balances-tbody');
  tbody.innerHTML = '';

  employees.forEach(emp => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span style="font-family:monospace; font-weight:600; color:var(--text-secondary);">${emp.id}</span></td>
      <td>
        <div style="display:flex; align-items:center; gap:8px;">
          <div class="user-avatar" style="width:28px; height:28px; font-size:0.75rem; background-color:${emp.avatarBg}">${getInitials(emp.name)}</div>
          <span style="font-weight:600;">${emp.name}</span>
        </div>
      </td>
      <td>${emp.department}</td>
      <td>${emp.leaveBalances.casual.allocated - emp.leaveBalances.casual.used} / ${emp.leaveBalances.casual.allocated} days</td>
      <td>${emp.leaveBalances.medical.allocated - emp.leaveBalances.medical.used} / ${emp.leaveBalances.medical.allocated} days</td>
      <td>${emp.leaveBalances.paid.allocated - emp.leaveBalances.paid.used} / ${emp.leaveBalances.paid.allocated} days</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="openAdjustDialog('${emp.id}')">Adjust</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Adjust Allocation Trigger
window.openAdjustDialog = function(employeeId) {
  const employees = ELMS_Store.getEmployees();
  const emp = employees.find(e => e.id === employeeId);
  if (!emp) return;

  document.getElementById('adjust-emp-id').value = emp.id;
  document.getElementById('adjust-emp-name').textContent = `${emp.name} (${emp.department})`;
  
  const typeSelect = document.getElementById('adjust-leave-type');
  const allocatedInput = document.getElementById('adjust-new-allocated');
  
  function updateInputValue() {
    const selectedType = typeSelect.value;
    allocatedInput.value = emp.leaveBalances[selectedType].allocated;
  }

  typeSelect.onchange = updateInputValue;
  updateInputValue(); // Initial set
  
  openModal('modal-adjust-balance');
};

// TOAST NOTIFICATIONS UTILITY
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 8 12 12 14 14"></polyline><path d="M9 12l2 2 4-4"></path></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  } else {
    iconSvg = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `
    <div class="toast-icon">${iconSvg}</div>
    <div class="toast-message" style="font-size: 0.9rem; font-weight: 500;">${message}</div>
  `;

  container.appendChild(toast);
  
  // Trigger animation next tick
  setTimeout(() => toast.classList.add('show'), 10);

  // Auto remove
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// CONFETTI PHYSICS ANIMATOR
function fireConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
  const particles = [];

  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0
    });
  }

  let animationFrameId;
  const startTime = Date.now();

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Stop after 3.5 seconds
    if (Date.now() - startTime > 3500) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrameId);
      return;
    }

    particles.forEach((p, idx) => {
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
      p.x += Math.sin(p.tiltAngle);
      p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      ctx.stroke();

      // Wrap particles back to top if they fall below screen
      if (p.y > canvas.height) {
        particles[idx] = {
          ...p,
          x: Math.random() * canvas.width,
          y: -20,
          tilt: Math.random() * 10 - 5
        };
      }
    });

    animationFrameId = requestAnimationFrame(draw);
  }

  draw();
}

// HELPERS
function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function formatDate(dateStr) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', options);
}

function getEmployeeRemainingBalance(employee, leaveType) {
  if (!employee || !employee.leaveBalances || !employee.leaveBalances[leaveType]) return 0;
  const bal = employee.leaveBalances[leaveType];
  return bal.allocated - bal.used;
}
