// Data layer and LocalStorage persistence for the Employee Leave Management System

const STORAGE_KEY_EMPLOYEES = 'elms_employees';
const STORAGE_KEY_LEAVES = 'elms_leaves';
const STORAGE_KEY_CURRENT_USER = 'elms_current_user';

// Mock Employees List
const DEFAULT_EMPLOYEES = [
  {
    id: 'EMP001',
    name: 'Sarah Connor',
    email: 'sarah.connor@cyberdyne.com',
    role: 'HR Admin',
    department: 'Human Resources',
    avatarBg: '#ff4b5c', // Crimson
    leaveBalances: {
      casual: { allocated: 10, used: 2 },
      medical: { allocated: 8, used: 0 },
      paid: { allocated: 15, used: 1 }
    }
  },
  {
    id: 'EMP002',
    name: 'John Doe',
    email: 'john.doe@cyberdyne.com',
    role: 'Employee',
    department: 'Engineering',
    avatarBg: '#00d2fc', // Neon Cyan
    leaveBalances: {
      casual: { allocated: 10, used: 4 },
      medical: { allocated: 8, used: 1 },
      paid: { allocated: 15, used: 3 }
    }
  },
  {
    id: 'EMP003',
    name: 'Ellen Ripley',
    email: 'ellen.ripley@cyberdyne.com',
    role: 'Employee',
    department: 'Operations',
    avatarBg: '#a020f0', // Purple
    leaveBalances: {
      casual: { allocated: 10, used: 0 },
      medical: { allocated: 8, used: 3 },
      paid: { allocated: 15, used: 5 }
    }
  },
  {
    id: 'EMP004',
    name: 'Bruce Wayne',
    email: 'bruce.wayne@cyberdyne.com',
    role: 'Employee',
    department: 'Executive Office',
    avatarBg: '#fbc02d', // Amber
    leaveBalances: {
      casual: { allocated: 10, used: 5 },
      medical: { allocated: 8, used: 0 },
      paid: { allocated: 15, used: 0 }
    }
  },
  {
    id: 'EMP005',
    name: 'Tony Stark',
    email: 'tony.stark@cyberdyne.com',
    role: 'Employee',
    department: 'R&D',
    avatarBg: '#ff6f00', // Deep Orange
    leaveBalances: {
      casual: { allocated: 10, used: 1 },
      medical: { allocated: 8, used: 2 },
      paid: { allocated: 15, used: 4 }
    }
  }
];

// Mock Leaves List
// Current Date reference is 2026-07-02
const DEFAULT_LEAVES = [
  {
    id: 'LV-001',
    employeeId: 'EMP002',
    employeeName: 'John Doe',
    leaveType: 'casual',
    startDate: '2026-06-15',
    endDate: '2026-06-18',
    reason: 'Family trip to Yosemite.',
    status: 'Approved',
    appliedOn: '2026-06-10',
    duration: 4,
    hrComment: 'Approved. Enjoy your vacation!'
  },
  {
    id: 'LV-002',
    employeeId: 'EMP003',
    employeeName: 'Ellen Ripley',
    leaveType: 'medical',
    startDate: '2026-07-06',
    endDate: '2026-07-10',
    reason: 'Dental surgery and post-op recovery.',
    status: 'Approved',
    appliedOn: '2026-06-28',
    duration: 5,
    hrComment: 'Approved. Take care and rest well.'
  },
  {
    id: 'LV-003',
    employeeId: 'EMP001',
    employeeName: 'Sarah Connor',
    leaveType: 'paid',
    startDate: '2026-06-01',
    endDate: '2026-06-02',
    reason: 'Personal appointments.',
    status: 'Approved',
    appliedOn: '2026-05-25',
    duration: 2,
    hrComment: 'Self-approved HR leave.'
  },
  {
    id: 'LV-004',
    employeeId: 'EMP002',
    employeeName: 'John Doe',
    leaveType: 'casual',
    startDate: '2026-07-13',
    endDate: '2026-07-15',
    reason: 'Moving to a new apartment.',
    status: 'Pending',
    appliedOn: '2026-07-01',
    duration: 3,
    hrComment: ''
  },
  {
    id: 'LV-005',
    employeeId: 'EMP003',
    employeeName: 'Ellen Ripley',
    leaveType: 'casual',
    startDate: '2026-06-24',
    endDate: '2026-06-25',
    reason: 'Attending a gaming tournament.',
    status: 'Rejected',
    appliedOn: '2026-06-15',
    duration: 2,
    hrComment: 'Rejected due to critical project deadline during this window.'
  },
  {
    id: 'LV-006',
    employeeId: 'EMP004',
    employeeName: 'Bruce Wayne',
    leaveType: 'casual',
    startDate: '2026-06-29',
    endDate: '2026-07-03',
    reason: 'Private business conference.',
    status: 'Approved',
    appliedOn: '2026-06-20',
    duration: 5,
    hrComment: 'Approved.'
  },
  {
    id: 'LV-007',
    employeeId: 'EMP005',
    employeeName: 'Tony Stark',
    leaveType: 'paid',
    startDate: '2026-07-20',
    endDate: '2026-07-24',
    reason: 'Testing new tech prototype in remote facility.',
    status: 'Pending',
    appliedOn: '2026-07-02',
    duration: 5,
    hrComment: ''
  }
];

// Helper: Calculate duration between two dates (inclusive)
// Excludes weekends for professional touch!
function calculateDuration(startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  if (isNaN(start) || isNaN(end) || start > end) return 0;
  
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) { // Exclude Sunday (0) and Saturday (6)
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

// Initializing state
const ELMS_Store = {
  getEmployees() {
    let employees = localStorage.getItem(STORAGE_KEY_EMPLOYEES);
    if (!employees) {
      localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(DEFAULT_EMPLOYEES));
      employees = JSON.stringify(DEFAULT_EMPLOYEES);
    }
    return JSON.parse(employees);
  },

  saveEmployees(employees) {
    localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(employees));
  },

  getLeaves() {
    let leaves = localStorage.getItem(STORAGE_KEY_LEAVES);
    if (!leaves) {
      localStorage.setItem(STORAGE_KEY_LEAVES, JSON.stringify(DEFAULT_LEAVES));
      leaves = JSON.stringify(DEFAULT_LEAVES);
    }
    return JSON.parse(leaves);
  },

  saveLeaves(leaves) {
    localStorage.setItem(STORAGE_KEY_LEAVES, JSON.stringify(leaves));
  },

  getCurrentUser() {
    let user = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (!user) {
      // Default to Sarah Connor (HR Admin) for first load
      const defaultUser = this.getEmployees()[0];
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(defaultUser));
      user = JSON.stringify(defaultUser);
    }
    return JSON.parse(user);
  },

  setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
  },

  // Add a new leave request
  addLeaveRequest(employeeId, leaveType, startDate, endDate, reason) {
    const employees = this.getEmployees();
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) throw new Error('Employee not found');

    const duration = calculateDuration(startDate, endDate);
    if (duration <= 0) throw new Error('Leave must span at least 1 working day (weekends excluded).');

    // Check balance
    const balance = employee.leaveBalances[leaveType];
    const remaining = balance.allocated - balance.used;
    if (duration > remaining) {
      throw new Error(`Insufficient balance. You requested ${duration} days, but only have ${remaining} days left.`);
    }

    const leaves = this.getLeaves();
    const newId = `LV-${String(leaves.length + 1).padStart(3, '0')}`;
    const newLeave = {
      id: newId,
      employeeId: employee.id,
      employeeName: employee.name,
      leaveType,
      startDate,
      endDate,
      reason,
      status: 'Pending',
      appliedOn: new Date().toISOString().split('T')[0],
      duration,
      hrComment: ''
    };

    leaves.unshift(newLeave); // Prepend to show most recent first
    this.saveLeaves(leaves);
    return newLeave;
  },

  // Approve/Reject leave request
  updateLeaveStatus(leaveId, status, hrComment = '') {
    const leaves = this.getLeaves();
    const leaveIndex = leaves.findIndex(l => l.id === leaveId);
    if (leaveIndex === -1) throw new Error('Leave request not found');

    const leave = leaves[leaveIndex];
    if (leave.status !== 'Pending') throw new Error('Request has already been processed');

    leave.status = status;
    leave.hrComment = hrComment;

    // If approved, update employee's used leaves
    if (status === 'Approved') {
      const employees = this.getEmployees();
      const employee = employees.find(e => e.id === leave.employeeId);
      if (employee) {
        employee.leaveBalances[leave.leaveType].used += leave.duration;
        this.saveEmployees(employees);
      }
    }

    this.saveLeaves(leaves);
    return leave;
  },

  // Cancel pending request by Employee
  cancelLeaveRequest(leaveId) {
    const leaves = this.getLeaves();
    const leaveIndex = leaves.findIndex(l => l.id === leaveId);
    if (leaveIndex === -1) throw new Error('Leave request not found');

    const leave = leaves[leaveIndex];
    if (leave.status !== 'Pending') throw new Error('Only pending requests can be cancelled');

    leaves.splice(leaveIndex, 1);
    this.saveLeaves(leaves);
    return leaveId;
  },

  // Update employee leave balance (Admin action)
  updateEmployeeBalance(employeeId, leaveType, newAllocated) {
    const employees = this.getEmployees();
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) throw new Error('Employee not found');

    employee.leaveBalances[leaveType].allocated = parseInt(newAllocated, 10);
    this.saveEmployees(employees);
    return employee;
  },

  // Reset entire application to initial state
  resetAll() {
    localStorage.removeItem(STORAGE_KEY_EMPLOYEES);
    localStorage.removeItem(STORAGE_KEY_LEAVES);
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    return {
      employees: this.getEmployees(),
      leaves: this.getLeaves(),
      currentUser: this.getCurrentUser()
    };
  }
};

// Export to window object for access in app.js
window.ELMS_Store = ELMS_Store;
window.calculateDuration = calculateDuration;
