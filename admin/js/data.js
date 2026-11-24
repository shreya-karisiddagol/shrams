/* ═══════════════════════════════════════════════════════
   SHRAMS – Mock Data Store
═══════════════════════════════════════════════════════ */

const DB = {

  /* ── Admin ─────────────────────────────────────────── */
  admin: { username: 'admin', password: 'admin123', name: 'Admin User', email: 'admin@shrams.edu' },

  /* ── Students ──────────────────────────────────────── */
  students: [
    { id:'S001', name:'Aarav Sharma',      usn:'1VK21CS001', dept:'Computer Science',       sem:5, email:'aarav@college.edu',    phone:'9876543210', parentPhone:'9876543200', status:'active',   room:'A-101', hostel:'Boys Hostel A', gender:'Male',   doa:'2024-08-01' },
    { id:'S002', name:'Priya Nair',        usn:'1VK21EC022', dept:'Electronics',             sem:3, email:'priya@college.edu',    phone:'9876543211', parentPhone:'9876543201', status:'active',   room:'G-205', hostel:'Girls Hostel', gender:'Female', doa:'2024-08-01' },
    { id:'S003', name:'Rahul Verma',       usn:'1VK22ME045', dept:'Mechanical Engineering',  sem:3, email:'rahul@college.edu',    phone:'9876543212', parentPhone:'9876543202', status:'active',   room:'B-312', hostel:'Boys Hostel B', gender:'Male',   doa:'2024-08-10' },
    { id:'S004', name:'Sneha Patel',       usn:'1VK21IS033', dept:'Information Science',     sem:5, email:'sneha@college.edu',    phone:'9876543213', parentPhone:'9876543203', status:'active',   room:'G-110', hostel:'Girls Hostel', gender:'Female', doa:'2024-08-01' },
    { id:'S005', name:'Kiran Kumar',       usn:'1VK23CV010', dept:'Civil Engineering',       sem:1, email:'kiran@college.edu',    phone:'9876543214', parentPhone:'9876543204', status:'active',   room:'A-204', hostel:'Boys Hostel A', gender:'Male',   doa:'2024-08-15' },
    { id:'S006', name:'Meera Reddy',       usn:'1VK21AI055', dept:'AI & ML',                 sem:5, email:'meera@college.edu',    phone:'9876543215', parentPhone:'9876543205', status:'inactive', room:'—',     hostel:'—',            gender:'Female', doa:'2024-08-01' },
    { id:'S007', name:'Arjun Menon',       usn:'1VK22CS078', dept:'Computer Science',       sem:3, email:'arjun@college.edu',    phone:'9876543216', parentPhone:'9876543206', status:'active',   room:'B-105', hostel:'Boys Hostel B', gender:'Male',   doa:'2024-08-10' },
    { id:'S008', name:'Divya Singh',       usn:'1VK21EC091', dept:'Electronics',             sem:5, email:'divya@college.edu',    phone:'9876543217', parentPhone:'9876543207', status:'active',   room:'G-308', hostel:'Girls Hostel', gender:'Female', doa:'2024-08-01' },
    { id:'S009', name:'Rohan Das',         usn:'1VK23ME012', dept:'Mechanical Engineering',  sem:1, email:'rohan@college.edu',    phone:'9876543218', parentPhone:'9876543208', status:'active',   room:'A-302', hostel:'Boys Hostel A', gender:'Male',   doa:'2024-08-15' },
    { id:'S010', name:'Ananya Joshi',      usn:'1VK22IS044', dept:'Information Science',     sem:3, email:'ananya@college.edu',   phone:'9876543219', parentPhone:'9876543209', status:'active',   room:'G-402', hostel:'Girls Hostel', gender:'Female', doa:'2024-08-10' },
    { id:'S011', name:'Vikas Nanda',       usn:'1VK21AI022', dept:'AI & ML',                 sem:5, email:'vikas@college.edu',    phone:'9876500001', parentPhone:'9876500011', status:'active',   room:'B-201', hostel:'Boys Hostel B', gender:'Male',   doa:'2024-08-01' },
    { id:'S012', name:'Lakshmi Iyer',      usn:'1VK21CS099', dept:'Computer Science',       sem:5, email:'lakshmi@college.edu',  phone:'9876500002', parentPhone:'9876500012', status:'inactive', room:'—',     hostel:'—',            gender:'Female', doa:'2024-08-01' },
  ],

  /* ── Wardens ───────────────────────────────────────── */
  wardens: [
    { id:'W001', name:'Dr. Ramesh Kumar',   email:'ramesh@college.edu', phone:'9800000001', hostel:'Boys Hostel A',  block:'Block A', experience:'8 yrs',  status:'active',   joinDate:'2018-06-01' },
    { id:'W002', name:'Prof. Sunita Rao',   email:'sunita@college.edu', phone:'9800000002', hostel:'Girls Hostel',   block:'Block G', experience:'5 yrs',  status:'active',   joinDate:'2021-01-10' },
    { id:'W003', name:'Dr. Anil Sharma',    email:'anil@college.edu',   phone:'9800000003', hostel:'Boys Hostel B',  block:'Block B', experience:'12 yrs', status:'active',   joinDate:'2015-07-15' },
    { id:'W004', name:'Mrs. Kavitha Nair',  email:'kavitha@college.edu',phone:'9800000004', hostel:'Girls Hostel',   block:'Block G', experience:'3 yrs',  status:'active',   joinDate:'2023-08-01' },
    { id:'W005', name:'Mr. Suresh Pillai',  email:'suresh@college.edu', phone:'9800000005', hostel:'Boys Hostel A',  block:'Block A', experience:'6 yrs',  status:'inactive', joinDate:'2020-01-01' },
  ],

  /* ── Maintenance Staff ─────────────────────────────── */
  staff: [
    { id:'M001', name:'Ramaiah',     category:'Electrical',  hostel:'Boys Hostel A',  phone:'9700000001', tasks:3, completed:28, status:'available', joinDate:'2020-01-15' },
    { id:'M002', name:'Murugan',     category:'Plumbing',    hostel:'Boys Hostel A',  phone:'9700000002', tasks:1, completed:34, status:'busy',      joinDate:'2019-05-10' },
    { id:'M003', name:'Selvam',      category:'Carpentry',   hostel:'Boys Hostel B',  phone:'9700000003', tasks:0, completed:19, status:'available', joinDate:'2021-03-20' },
    { id:'M004', name:'Pushpa Bai',  category:'Housekeeping',hostel:'Girls Hostel',   phone:'9700000004', tasks:2, completed:45, status:'busy',      joinDate:'2018-11-01' },
    { id:'M005', name:'Raju',        category:'Electrical',  hostel:'Boys Hostel B',  phone:'9700000005', tasks:0, completed:12, status:'available', joinDate:'2022-07-01' },
    { id:'M006', name:'Lakshman',    category:'General',     hostel:'Boys Hostel A',  phone:'9700000006', tasks:4, completed:38, status:'busy',      joinDate:'2019-02-14' },
    { id:'M007', name:'Manjula',     category:'Housekeeping',hostel:'Girls Hostel',   phone:'9700000007', tasks:1, completed:52, status:'available', joinDate:'2017-08-20' },
    { id:'M008', name:'Baskar',      category:'Plumbing',    hostel:'Boys Hostel B',  phone:'9700000008', tasks:2, completed:21, status:'busy',      joinDate:'2021-10-05' },
  ],

  /* ── Hostels ───────────────────────────────────────── */
  hostels: [
    {
      id:'H001', name:'Boys Hostel A', gender:'Male',
      blocks:['A'], floors:4, totalRooms:80, totalBeds:160,
      occupied:142, available:12, maintenance:4, reserved:2,
      warden:'Dr. Ramesh Kumar', facilities:['Wi-Fi','Laundry','Gym','Canteen','Study Hall'],
      location:'North Campus', established:'2010', status:'active'
    },
    {
      id:'H002', name:'Boys Hostel B', gender:'Male',
      blocks:['B'], floors:4, totalRooms:70, totalBeds:140,
      occupied:118, available:16, maintenance:4, reserved:2,
      warden:'Dr. Anil Sharma', facilities:['Wi-Fi','Laundry','Canteen','Study Hall','Sports Room'],
      location:'East Campus', established:'2015', status:'active'
    },
    {
      id:'H003', name:'Girls Hostel', gender:'Female',
      blocks:['G'], floors:4, totalRooms:90, totalBeds:180,
      occupied:155, available:18, maintenance:5, reserved:2,
      warden:'Prof. Sunita Rao', facilities:['Wi-Fi','Laundry','Gym','Canteen','Study Hall','Beauty Salon'],
      location:'South Campus', established:'2012', status:'active'
    }
  ],

  /* ── Applications ──────────────────────────────────── */
  applications: [
    { id:'APP001', student:'S006', name:'Meera Reddy',   usn:'1VK21AI055', dept:'AI & ML',         hostelPref:'Girls Hostel', roomType:'Double Sharing', appliedDate:'2026-11-20', status:'pending',  priority:'normal' },
    { id:'APP002', student:'S012', name:'Lakshmi Iyer',  usn:'1VK21CS099', dept:'Computer Science', hostelPref:'Girls Hostel', roomType:'Single',         appliedDate:'2026-11-18', status:'pending',  priority:'normal' },
    { id:'APP003', student:'NEW1', name:'Deepak Ghosh',  usn:'1VK23EE004', dept:'Electrical',       hostelPref:'Boys Hostel A',roomType:'Double Sharing', appliedDate:'2026-11-22', status:'pending',  priority:'urgent' },
    { id:'APP004', student:'NEW2', name:'Anjali Mishra', usn:'1VK23CS012', dept:'Computer Science', hostelPref:'Girls Hostel', roomType:'Triple Sharing', appliedDate:'2026-11-23', status:'pending',  priority:'normal' },
    { id:'APP005', student:'NEW3', name:'Ravi Teja',     usn:'1VK23ME022', dept:'Mechanical',       hostelPref:'Boys Hostel B',roomType:'Double Sharing', appliedDate:'2026-11-15', status:'approved', priority:'normal' },
    { id:'APP006', student:'NEW4', name:'Pooja Kulkarni',usn:'1VK22IS077', dept:'Info Science',     hostelPref:'Girls Hostel', roomType:'Double Sharing', appliedDate:'2026-11-10', status:'rejected', priority:'normal' },
    { id:'APP007', student:'NEW5', name:'Amit Roy',      usn:'1VK22CS044', dept:'Computer Science', hostelPref:'Boys Hostel A',roomType:'Single',         appliedDate:'2026-11-24', status:'pending',  priority:'normal' },
  ],

  /* ── Maintenance Complaints ────────────────────────── */
  complaints: [
    { id:'C001', student:'S001', name:'Aarav Sharma',   room:'A-101', hostel:'Boys Hostel A', category:'Electrical', desc:'Fan not working',           priority:'medium', status:'open',       assignedTo:'M001', submittedDate:'2026-11-22', resolvedDate:null,         images:[] },
    { id:'C002', student:'S003', name:'Rahul Verma',    room:'B-312', hostel:'Boys Hostel B', category:'Plumbing',   desc:'Water leakage from pipe',    priority:'high',   status:'inprogress', assignedTo:'M008', submittedDate:'2026-11-21', resolvedDate:null,         images:[] },
    { id:'C003', student:'S002', name:'Priya Nair',     room:'G-205', hostel:'Girls Hostel',  category:'Electrical', desc:'Power outlet not working',   priority:'low',    status:'resolved',   assignedTo:'M001', submittedDate:'2026-11-18', resolvedDate:'2026-11-20', images:[] },
    { id:'C004', student:'S004', name:'Sneha Patel',    room:'G-110', hostel:'Girls Hostel',  category:'Housekeeping',desc:'Pest infestation in room',   priority:'critical',status:'open',      assignedTo:null,   submittedDate:'2026-11-23', resolvedDate:null,         images:[] },
    { id:'C005', student:'S007', name:'Arjun Menon',    room:'B-105', hostel:'Boys Hostel B', category:'Carpentry',  desc:'Door hinge broken',          priority:'low',    status:'inprogress', assignedTo:'M003', submittedDate:'2026-11-20', resolvedDate:null,         images:[] },
    { id:'C006', student:'S005', name:'Kiran Kumar',    room:'A-204', hostel:'Boys Hostel A', category:'Plumbing',   desc:'Bathroom tap broken',        priority:'high',   status:'onhold',     assignedTo:'M002', submittedDate:'2026-11-19', resolvedDate:null,         images:[] },
    { id:'C007', student:'S008', name:'Divya Singh',    room:'G-308', hostel:'Girls Hostel',  category:'Electrical', desc:'Light bulb fused',           priority:'low',    status:'resolved',   assignedTo:'M001', submittedDate:'2026-11-15', resolvedDate:'2026-11-16', images:[] },
    { id:'C008', student:'S009', name:'Rohan Das',      room:'A-302', hostel:'Boys Hostel A', category:'General',    desc:'Mattress needs replacement', priority:'medium', status:'open',       assignedTo:null,   submittedDate:'2026-11-24', resolvedDate:null,         images:[] },
  ],

  /* ── Rooms (sample) ────────────────────────────────── */
  rooms: [
    { id:'R001', number:'A-101', hostel:'Boys Hostel A', block:'A', floor:1, type:'Double Sharing', capacity:2, occupied:2, status:'occupied',    beds:['B01-S001','B02-S009'] },
    { id:'R002', number:'A-102', hostel:'Boys Hostel A', block:'A', floor:1, type:'Double Sharing', capacity:2, occupied:1, status:'partial',      beds:['B01-S005','B02-—'] },
    { id:'R003', number:'A-103', hostel:'Boys Hostel A', block:'A', floor:1, type:'Single',         capacity:1, occupied:0, status:'available',    beds:['B01-—'] },
    { id:'R004', number:'A-104', hostel:'Boys Hostel A', block:'A', floor:1, type:'Double Sharing', capacity:2, occupied:2, status:'occupied',    beds:['B01-S007','B02-S011'] },
    { id:'R005', number:'A-105', hostel:'Boys Hostel A', block:'A', floor:1, type:'Triple Sharing', capacity:3, occupied:0, status:'maintenance',  beds:['B01-—','B02-—','B03-—'] },
    { id:'R006', number:'G-205', hostel:'Girls Hostel',  block:'G', floor:2, type:'Double Sharing', capacity:2, occupied:2, status:'occupied',    beds:['B01-S002','B02-S008'] },
    { id:'R007', number:'G-110', hostel:'Girls Hostel',  block:'G', floor:1, type:'Single',         capacity:1, occupied:1, status:'occupied',    beds:['B01-S004'] },
    { id:'R008', number:'B-312', hostel:'Boys Hostel B', block:'B', floor:3, type:'Double Sharing', capacity:2, occupied:2, status:'occupied',    beds:['B01-S003','B02-S007'] },
    { id:'R009', number:'B-105', hostel:'Boys Hostel B', block:'B', floor:1, type:'Double Sharing', capacity:2, occupied:1, status:'partial',      beds:['B01-S007','B02-—'] },
    { id:'R010', number:'G-308', hostel:'Girls Hostel',  block:'G', floor:3, type:'Double Sharing', capacity:2, occupied:2, status:'occupied',    beds:['B01-S008','B02-S010'] },
  ],

  /* ── Notifications ─────────────────────────────────── */
  notifications: [
    { id:'N001', type:'critical', icon:'fa-fire', iconColor:'red',    title:'Critical Complaint',       desc:'Pest infestation reported in G-110 (Girls Hostel)', time:'2 min ago', read:false },
    { id:'N002', type:'pending',  icon:'fa-file-alt', iconColor:'orange', title:'New Applications',     desc:'4 new hostel applications awaiting approval', time:'1 hr ago', read:false },
    { id:'N003', type:'info',     icon:'fa-user-plus', iconColor:'blue', title:'New Warden Account',    desc:'Mrs. Kavitha Nair account created successfully', time:'3 hrs ago', read:true },
    { id:'N004', type:'warning',  icon:'fa-tools', iconColor:'orange',  title:'Overdue Complaint',      desc:'Complaint C006 is overdue by 2 days', time:'5 hrs ago', read:false },
    { id:'N005', type:'success',  icon:'fa-check-circle', iconColor:'green', title:'Room Allocated',   desc:'Room B-201 allocated to Vikas Nanda (S011)', time:'1 day ago', read:true },
  ],

  /* ── Announcements ─────────────────────────────────── */
  announcements: [
    { id:'AN001', title:'Annual Hostel Day Celebration', type:'info',    audience:['Students','Wardens'],   date:'2026-11-25', author:'Admin', body:'Hostel Day will be celebrated on 30th November. All residents are requested to participate in cultural events.', pinned:true  },
    { id:'AN002', title:'Water Supply Maintenance',      type:'warning', audience:['Students'],             date:'2026-11-24', author:'Admin', body:'Water supply will be interrupted on 25th November from 8AM–12PM for maintenance work.', pinned:true },
    { id:'AN003', title:'End Semester Rules Reminder',   type:'urgent',  audience:['Students','Wardens'],   date:'2026-11-20', author:'Admin', body:'End semester examination rules are in effect. Gate closing time is 9:00 PM. No exceptions.', pinned:false },
    { id:'AN004', title:'Wi-Fi Upgrade Completion',      type:'info',    audience:['Students'],             date:'2026-11-18', author:'Admin', body:'Wi-Fi has been upgraded to 100 Mbps fiber across all hostels. Use new network: SHRAMS-5G.', pinned:false },
  ],

  /* ── Activity Log ──────────────────────────────────── */
  activityLog: [
    { id:'L001', action:'User Account Created',   detail:'Warden account created for Mrs. Kavitha Nair',   user:'Admin', time:'2026-11-24 17:30', type:'success' },
    { id:'L002', action:'Room Allocated',          detail:'Room B-201 allocated to Vikas Nanda (S011)',      user:'Admin', time:'2026-11-24 15:00', type:'success' },
    { id:'L003', action:'Application Rejected',    detail:'Application APP006 rejected – No vacancy',        user:'Admin', time:'2026-11-23 11:20', type:'danger'  },
    { id:'L004', action:'Complaint Assigned',      detail:'Complaint C002 assigned to Murugan (Plumbing)',   user:'Admin', time:'2026-11-23 10:00', type:'info'    },
    { id:'L005', action:'Announcement Published',  detail:'Water Supply Maintenance notice published',        user:'Admin', time:'2026-11-24 09:00', type:'warning' },
    { id:'L006', action:'Config Updated',          detail:'Complaint categories updated',                     user:'Admin', time:'2026-11-22 16:00', type:'info'    },
    { id:'L007', action:'Student Deactivated',     detail:'Account deactivated for Meera Reddy (S006)',       user:'Admin', time:'2026-11-21 14:30', type:'danger'  },
    { id:'L008', action:'Application Approved',    detail:'Application APP005 approved for Ravi Teja',        user:'Admin', time:'2026-11-20 10:45', type:'success' },
    { id:'L009', action:'Hostel Config Updated',   detail:'Girls Hostel facilities list updated',             user:'Admin', time:'2026-11-19 09:15', type:'info'    },
    { id:'L010', action:'Backup Completed',        detail:'Database backup completed successfully – 2.4 GB', user:'System', time:'2026-11-24 02:00', type:'success' },
  ],

  /* ── Config ────────────────────────────────────────── */
  config: {
    allocation: {
      autoAllocate: true,
      preferByDept: true,
      respectGender: true,
      maxPerRoom: 3,
    },
    complaints: {
      categories: ['Electrical','Plumbing','Carpentry','Housekeeping','General','Network','Furniture'],
      priorities:  ['low','medium','high','critical'],
      autoAssign: false,
      criticalAlertEmail: true,
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      appPush: true,
    }
  }
};
