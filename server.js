const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 7878;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// مسارات الملفات
const PASSWORDS_FILE = 'passwords.json';
const CODES_FILE = 'codes.json';
const SESSIONS_FILE = 'sessions.json';

// التأكد من وجود الملفات
function ensureFiles() {
    if (!fs.existsSync(PASSWORDS_FILE)) {
        fs.writeFileSync(PASSWORDS_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(CODES_FILE)) {
        fs.writeFileSync(CODES_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(SESSIONS_FILE)) {
        fs.writeFileSync(SESSIONS_FILE, JSON.stringify([], null, 2));
    }
}

// قراءة البيانات من الملفات
function readPasswords() {
    try {
        const data = fs.readFileSync(PASSWORDS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function readCodes() {
    try {
        const data = fs.readFileSync(CODES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function readSessions() {
    try {
        const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// كتابة البيانات إلى الملفات
function writePasswords(passwords) {
    fs.writeFileSync(PASSWORDS_FILE, JSON.stringify(passwords, null, 2));
}

function writeCodes(codes) {
    fs.writeFileSync(CODES_FILE, JSON.stringify(codes, null, 2));
}

function writeSessions(sessions) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

// API Routes

// جلب كلمات السر
app.get('/api/passwords', (req, res) => {
    ensureFiles();
    const passwords = readPasswords();
    res.json(passwords);
});

// إضافة كلمة سر جديدة
app.post('/api/passwords', (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ error: 'كلمة السر مطلوبة' });
        }
        
        ensureFiles();
        const passwords = readPasswords();
        
        // التحقق من عدم تكرار كلمة السر
        if (passwords.includes(password)) {
            return res.status(400).json({ error: 'كلمة السر موجودة بالفعل' });
        }
        
        passwords.push(password);
        writePasswords(passwords);
        
        res.json({ message: 'تم إضافة كلمة السر بنجاح', password });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// حذف كلمة سر
app.delete('/api/passwords/:password', (req, res) => {
    try {
        const { password } = req.params;
        ensureFiles();
        const passwords = readPasswords();
        
        const index = passwords.indexOf(password);
        if (index === -1) {
            return res.status(404).json({ error: 'كلمة السر غير موجودة' });
        }
        
        passwords.splice(index, 1);
        writePasswords(passwords);
        
        res.json({ message: 'تم حذف كلمة السر بنجاح' });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// جلب الأكواد
app.get('/api/codes', (req, res) => {
    ensureFiles();
    const codes = readCodes();
    res.json(codes);
});

// إضافة كود جديد
app.post('/api/codes', (req, res) => {
    try {
        const { password, videoId, fileId, code, maxUses } = req.body;
        
        if (!password || !code) {
            return res.status(400).json({ error: 'كلمة السر والكود مطلوبان' });
        }
        
        if (!videoId && !fileId) {
            return res.status(400).json({ error: 'يجب تحديد رمز الفيديو أو الملف' });
        }
        
        ensureFiles();
        const codes = readCodes();
        
        // إنشاء كود جديد
        const newCode = {
            id: Date.now().toString(),
            password,
            videoId: videoId || '',
            fileId: fileId || '',
            code,
            used: false,
            useCount: 0,
            maxUses: maxUses || 2,
            createdAt: new Date().toISOString()
        };
        
        codes.push(newCode);
        writeCodes(codes);
        
        res.json({ message: 'تم إضافة الكود بنجاح', code: newCode });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// تحديث حالة الكود (مستخدم/غير مستخدم)
app.patch('/api/codes/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { used, useCount, maxUses } = req.body;
        
        ensureFiles();
        const codes = readCodes();
        
        const codeIndex = codes.findIndex(c => c.id === id);
        if (codeIndex === -1) {
            return res.status(404).json({ error: 'الكود غير موجود' });
        }
        
        if (used !== undefined) {
            codes[codeIndex].used = used;
            // إذا تم تفعيل الكود، إعادة تعيين عدد مرات الاستخدام
            if (used === false) {
                codes[codeIndex].useCount = 0;
            }
        }
        if (useCount !== undefined) {
            codes[codeIndex].useCount = useCount;
        }
        if (maxUses !== undefined) {
            codes[codeIndex].maxUses = maxUses;
        }
        
        codes[codeIndex].updatedAt = new Date().toISOString();
        
        writeCodes(codes);
        
        res.json({ message: 'تم تحديث حالة الكود بنجاح', code: codes[codeIndex] });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// زيادة عدد مرات استخدام الكود
app.post('/api/codes/:id/use', (req, res) => {
    try {
        const { id } = req.params;
        
        ensureFiles();
        const codes = readCodes();
        
        const codeIndex = codes.findIndex(c => c.id === id);
        if (codeIndex === -1) {
            return res.status(404).json({ error: 'الكود غير موجود' });
        }
        
        const code = codes[codeIndex];
        
        // زيادة عدد مرات الاستخدام
        code.useCount = (code.useCount || 0) + 1;
        
        // إذا وصل للحد الأقصى، تعليمه كمستخدم
        if (code.useCount >= (code.maxUses || 2)) {
            code.used = true;
        }
        
        code.updatedAt = new Date().toISOString();
        
        writeCodes(codes);
        
        res.json({ 
            message: 'تم تحديث عدد مرات الاستخدام', 
            code: code,
            canUse: code.useCount < (code.maxUses || 2)
        });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// حذف كود
app.delete('/api/codes/:id', (req, res) => {
    try {
        const { id } = req.params;
        ensureFiles();
        const codes = readCodes();
        
        const codeIndex = codes.findIndex(c => c.id === id);
        if (codeIndex === -1) {
            return res.status(404).json({ error: 'الكود غير موجود' });
        }
        
        codes.splice(codeIndex, 1);
        writeCodes(codes);
        
        res.json({ message: 'تم حذف الكود بنجاح' });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// تسجيل الدخول
app.post('/api/login', (req, res) => {
    try {
        const { password, deviceId } = req.body;
        if (!password || !deviceId) {
            return res.status(400).json({ error: 'كلمة السر ومعرف الجهاز مطلوبان' });
        }

        ensureFiles();
        const passwords = readPasswords();
        const sessions = readSessions();

        // التحقق من صحة كلمة السر
        if (!passwords.map(p => p.trim().toUpperCase()).includes(password.toUpperCase().trim())) {
            return res.status(401).json({ error: 'كلمة المرور غير صحيحة' });
        }

        const existingSession = sessions.find(s => s.password.toUpperCase() === password.toUpperCase());

        if (existingSession) {
            if (existingSession.deviceId === deviceId) {
                // نفس الجهاز، تسجيل دخول ناجح
                res.json({ message: 'تم تسجيل الدخول بنجاح' });
            } else {
                // جهاز مختلف، منع تسجيل الدخول
                return res.status(409).json({ error: 'هذا الحساب مسجل بالفعل على جهاز آخر' });
            }
        } else {
            // تسجيل دخول لأول مرة لهذا الحساب
            sessions.push({ password, deviceId });
            writeSessions(sessions);
            res.json({ message: 'تم تسجيل الدخول بنجاح' });
        }
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// تسجيل الخروج
app.post('/api/logout', (req, res) => {
    try {
        const { password, deviceId } = req.body;
        if (!password || !deviceId) {
            return res.status(400).json({ error: 'كلمة السر ومعرف الجهاز مطلوبان' });
        }

        ensureFiles();
        let sessions = readSessions();
        
        const initialLength = sessions.length;
        sessions = sessions.filter(s => !(s.password.toUpperCase() === password.toUpperCase() && s.deviceId === deviceId));

        if (sessions.length < initialLength) {
            writeSessions(sessions);
            res.json({ message: 'تم تسجيل الخروج بنجاح' });
        } else {
            // لم يتم العثور على جلسة مطابقة، ولكن لا يزال يعتبر نجاحًا من جانب العميل
            res.json({ message: 'لم يتم العثور على جلسة نشطة لتسجيل الخروج' });
        }
    } catch (error) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// التحقق من الجلسة
app.post('/api/verify-session', (req, res) => {
    try {
        const { password, deviceId } = req.body;
        if (!password || !deviceId) {
            return res.status(400).json({ valid: false, error: 'بيانات غير مكتملة' });
        }

        ensureFiles();
        const sessions = readSessions();
        
        const isValid = sessions.some(s => s.password.toUpperCase() === password.toUpperCase() && s.deviceId === deviceId);
        
        res.json({ valid: isValid });
    } catch (error) {
        res.status(500).json({ valid: false, error: 'خطأ في الخادم' });
    }
});

// تشغيل الخادم
app.listen(PORT, () => {
    console.log(`الخادم يعمل على المنفذ ${PORT}`);
    console.log(`يمكنك الوصول إلى لوحة الأدمن على: http://localhost:${PORT}/admin.html`);
    ensureFiles();
});
