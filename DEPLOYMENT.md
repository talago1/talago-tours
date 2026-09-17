# دليل رفع ونشر منصة تالاجو تورز (Talago Tours Deployment Guide)

يحتوي هذا الملف على دليل تفصيلي كامل ومفصل خطوة بخطوة لنشر ورفع منصة **Talago Tours** (الواجهة الأمامية للمستخدم، لوحة التحكم الخاصة بالمسؤولين، وقاعدة البيانات Supabase / Prisma).

---

## الفهرس
1. [المتطلبات الأساسية وحسابات الخدمة](#1-المتطلبات-الأساسية-وحسابات-الخدمة)
2. [خطوة 1: تهيئة وإعداد قاعدة البيانات (PostgreSQL / Supabase)](#خطوة-1-تهيئة-وإعداد-قاعدة-البيانات-postgresql--supabase)
3. [خطوة 2: تكوين المتغيرات البيئية (Environment Variables)](#خطوة-2-تكوين-المتغيرات-البيئية-environment-variables)
4. [خطوة 3: نشر وتوجيه المصادقة (Supabase Auth Redirects)](#خطوة-3-نشر-وتوجيه-المصادقة-supabase-auth-redirects)
5. [خطوة 4: خيارات النشر والرفع (Deployment Options)](#خطوة-4-خيارات-النشر-والرفع-deployment-options)
   - [الخيار الأول: النشر على منصة Vercel (موصى به وسهل للغاية)](#الخيار-الأول-النشر-على-منصة-vercel-موصى-به-وسهل-للغاية)
   - [الخيار الثاني: النشر على خادم خاص (VPS / Ubuntu / PM2)](#الخيار-الثاني-النشر-على-خادم-خاص-vps--ubuntu--pm2)
6. [خطوة 5: التحقق والاختبار النهائي بعد النشر (Smoke Test)](#خطوة-5-التحقق-والاختبار-النهائي-بعد-النشر-smoke-test)

---

## 1. المتطلبات الأساسية وحسابات الخدمة

قبل البدء بالرفع، ستحتاج إلى إعداد الحسابات التالية:
* **حساب Supabase**: لاستضافة قاعدة البيانات وإدارة المصادقة (Auth).
* **حساب GitHub**: لرفع الكود وتسهيل عملية النشر التلقائي (CI/CD).
* **حساب الاستضافة**: إما Vercel أو سيرفر خاص (VPS) مثل DigitalOcean أو Hetzner.
* **حساب Green-API**: لإرسال إشعارات الواتساب للعملاء (اختياري، لتفعيل تواصل الموقع التلقائي).
* **حساب Paymob / Fawry**: لمعالجة المدفوعات عبر الإنترنت (اختياري).

---

## خطوة 1: تهيئة وإعداد قاعدة البيانات (PostgreSQL / Supabase)

منصة Talago Tours تستخدم **Prisma ORM** للتعامل مع قاعدة بيانات **PostgreSQL** المستضافة على Supabase.

### 1. الحصول على روابط الاتصال من Supabase:
1. اذهب إلى لوحة تحكم مشروعك في **Supabase**.
2. توجه إلى **Project Settings** > **Database**.
3. ابحث عن **Connection Strings** وانسخ رابط الـ **Transaction Connection (Pooler)** ورابط الـ **Session/Direct Connection**.
   * رابط الـ Transaction (يستخدم منفذ 6543) سيوضع في المتغير `DATABASE_URL`.
   * رابط الـ Direct (يستخدم منفذ 5432) سيوضع في المتغير `DIRECT_URL`.

### 2. دفع وتطبيق بنية الجداول (Prisma Push):
من جهازك المحلي (Local Machine)، قم بتنفيذ الأوامر التالية لتوليد ملفات Prisma وتحديث الجداول على سيرفر Supabase مباشرة:

```bash
# 1. تثبيت الحزم للتأكد
npm install

# 2. توليد عميل بريسما (Prisma Client Generator)
npm run db:generate

# 3. دفع الجداول إلى السيرفر الحي (LIVE)
npm run db:push
```

> [!WARNING]
> أمر `db:push` يقوم بتحديث الجداول مباشرة. تأكد من أن روابط الاتصال بقاعدة البيانات في ملف `.env` تشير لقاعدة البيانات الصحيحة.

---

## خطوة 2: تكوين المتغيرات البيئية (Environment Variables)

يجب ضبط هذه المتغيرات بدقة في منصة الاستضافة (سواء Vercel أو سيرفر VPS). إليك قائمة المتغيرات ودور كل منها:

| اسم المتغير | القيمة والمصدر | الوصف |
| :--- | :--- | :--- |
| `DATABASE_URL` | رابط PostgreSQL من Supabase مع منفذ 6543 و `?pgbouncer=true` | رابط الاتصال الرئيسي بقاعدة البيانات للعمليات الجارية. |
| `DIRECT_URL` | رابط PostgreSQL من Supabase مع منفذ 5432 | رابط الاتصال المباشر بقاعدة البيانات المستخدم لعمليات الـ Migrations. |
| `NEXT_PUBLIC_SUPABASE_URL` | رابط المشروع من Supabase (مثال: `https://xxxx.supabase.co`) | واجهة برمجة تطبيقات Supabase العامة للعميل (Client). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | مفتاح Anon Key العام من Supabase | المفتاح العام لتسجيل الدخول والعمليات العامة للعميل. |
| `SUPABASE_SERVICE_ROLE_KEY` | مفتاح الخدمة الخاص (Service Role Key) من Supabase | **حساس جداً!** يُستخدم في السيرفر فقط للعمليات بصلاحيات مدير النظام (Admin). |
| `QR_HMAC_SECRET` | نص عشوائي طويل وآمن (مثال: `your-secure-production-hmac-key`) | يُستخدم لتشفير وتأكيد صلاحية الـ QR Codes للتذاكر وبطاقات الصعود. |
| `ADMIN_API_TOKEN` | توكن حماية المسؤولين (مثال: `talago_admin_secret_token`) | التوكن السري للمصادقة وتأمين لوحة التحكم للمسؤولين. |
| `NEXT_PUBLIC_BASE_URL` | الرابط الفعلي للموقع (مثال: `https://talago-tours.com`) | يُستخدم لتوليد الروابط الكاملة (Vouchers, QR codes, Redirects). |
| `GREEN_API_ID` | معرّف المثيل (Instance ID) من لوحة Green-API | لإرسال رسائل وإشعارات تأكيد الحجز للمستخدمين عبر الواتساب. |
| `GREEN_API_TOKEN` | توكن المثيل (Token) من لوحة Green-API | صلاحيات التحكم في الواتساب التابع لـ Green-API. |
| `PAYMOB_API_KEY` | مفتاح API Key من بوابة Paymob | لتفعيل الدفع بالبطاقات الائتمانية عبر الإنترنت. |
| `PAYMOB_INTEGRATION_ID` | معرف التكامل (Integration ID) للدفع كارت من Paymob | تكامل الدفع الخاص بالبطاقات. |
| `PAYMOB_HMAC_SECRET` | مفتاح الأمان (HMAC) من لوحة Paymob | للتحقق من أمان وسلامة إشعارات الدفع (Webhooks). |
| `FAWRY_MERCHANT_CODE` | كود التاجر من بوابة فوري (Fawry) | لتفعيل الدفع عبر فوري. |
| `FAWRY_HMAC_SECRET` | مفتاح الأمان (HMAC) من Fawry | للتحقق من صحة المعاملات عبر فوري. |
| `NEXT_PUBLIC_GA_ID` | معرّف قياس جوجل (مثال: `G-XXXXXXXXXX` أو معرّف Google Ads) | اختياري: لتتبع تحويلات إعلانات جوجل وزوار الموقع تلقائياً. |
| `NEXT_PUBLIC_META_PIXEL_ID` | معرّف بيكسل فيسبوك / إنستغرام (مثال: `123456789012345`) | اختياري: لتتبع تحويلات وحملات السوشيال ميديا وإعادة الاستهداف. |

---

## خطوة 3: نشر وتوجيه المصادقة (Supabase Auth Redirects)

بشكل افتراضي، يرسل Supabase روابط تفعيل الحسابات والروابط السحرية (Magic Links) وتوجيهها إلى `http://localhost:3000`. عند الرفع للإنتاج، يجب تحديث هذه الروابط:

1. اذهب إلى لوحة تحكم **Supabase**.
2. اختر مشروعك ثم اذهب إلى **Authentication** > **URL Configuration**.
3. قم بتعديل **Site URL** واجعله رابط موقعك الرئيسي للإنتاج، مثلاً: `https://your-domain.com`.
4. في قسم **Redirect URLs**، أضف روابط التوجيه المسموح بها مثل:
   * `https://your-domain.com/**`
   * `https://your-domain.com/my-bookings`
5. اضغط **Save** لحفظ الإعدادات.

> [!IMPORTANT]
> إذا لم تقم بتحديث هذه الإعدادات، فإن الضغط على الروابط السحرية في رسائل البريد الإلكتروني للمستخدمين سيحاول فتح `localhost:3000` ويعطي خطأ 404 أو خطأ عدم إمكانية الوصول للموقع.

---

## خطوة 4: خيارات النشر والرفع (Deployment Options)

---

### الخيار الأول: النشر على منصة Vercel (موصى به وسهل للغاية)

منصة Vercel هي الخيار الأمثل والأنسب لنشر تطبيقات **Next.js** لأنها تدعم كافة الميزات تلقائياً (Serverless Functions, Speed, Edge Caching).

#### الخطوات بالتفصيل الممل:
1. قم برفع كود المنصة بالكامل إلى مستودع خاص (Private Repository) على حسابك في **GitHub**.
2. سجل دخولك في موقع [Vercel](https://vercel.com) باستخدام حساب GitHub الخاص بك.
3. اضغط على زر **Add New** ثم اختر **Project**.
4. ستظهر لك قائمة بمستودعات GitHub الخاصة بك. ابحث عن مستودع مشروع `talago-tours` واضغط **Import**.
5. في صفحة الإعدادات قبل النشر (Configure Project):
   * اترك خيارات **Framework Preset** على `Next.js`.
   * اترك **Root Directory** كما هو `./`.
6. قم بفتح قسم **Environment Variables** وابدأ بإضافة المتغيرات البيئية المذكورة في [خطوة 2](#خطوة-2-تكوين-المتغيرات-البيئية-environment-variables) واحداً تلو الآخر (الاسم والقيمة).
7. اضغط على زر **Deploy**.
8. ستبدأ المنصة بعملية البناء (Building) وتجهيز السيرفر. ستستغرق العملية حوالي 2-3 دقائق.
9. فور اكتمال النشر، ستحصل على نطاق مجاني (مثل `talago-tours.vercel.app`). يمكنك لاحقاً ربط الدومين الخاص بك (`your-domain.com`) بكل سهولة من إعدادات النطاقات في Vercel (Settings > Domains).

---

### الخيار الثاني: النشر على خادم خاص (VPS / Ubuntu / PM2)

إذا كنت تفضل رفع المشروع على خادِم مستقل (سيرفر VPS خاص بك بنظام Ubuntu):

#### 1. تهيئة بيئة السيرفر وتثبيت Node.js:
اتصل بالسيرفر عبر الـ SSH ونفذ الأوامر التالية لتثبيت Node.js (الإصدار 18 أو 20) وإدارة العمليات PM2:

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git build-essential

# تثبيت مدير العمليات PM2 لضمان تشغيل التطبيق في الخلفية للأبد
sudo npm install -y -g pm2
```

#### 2. جلب المشروع وتهيئة ملف الإعدادات:
```bash
# جلب الكود من الجيت هاب
git clone <رابط-مستودعك-على-جيت-هاب> /var/www/talago-tours
cd /var/www/talago-tours

# تثبيت الحزم
npm install

# إنشاء ملف المتغيرات البيئية وكتابة المتغيرات بداخله
nano .env
# (الصق المتغيرات البيئية بالقيم الفعلية للإنتاج ثم احفظ الملف عن طريق Ctrl+O ثم Enter ثم Ctrl+X للخروج)
```

#### 3. بناء المشروع وتوليد جداول قاعدة البيانات:
```bash
npx prisma generate
npx prisma db push
npm run build
```

#### 4. تشغيل التطبيق باستخدام PM2:
سنقوم بتشغيل التطبيق باسم `talago-web` ليعمل في الخلفية ويقوم بإعادة تشغيل نفسه تلقائياً في حال حدوث أي خطأ أو إعادة تشغيل للسيرفر:

```bash
pm2 start npm --name "talago-web" -- run start
# حفظ العمليات لتعمل عند تشغيل السيرفر
pm2 save
pm2 startup
```

#### 5. إعداد خادم Nginx كـ Reverse Proxy وتأمين دومين الموقع بـ SSL:
قم بتثبيت Nginx لتوجيه الطلبات القادمة على المنفذ 80 و 443 إلى المنفذ الداخلي للمشروع (المنفذ 3000):

```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/talago
```

أضف الإعدادات التالية إلى الملف (مع استبدال `your-domain.com` بنطاقك الفعلي):

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

قم بتفعيل الإعدادات وإعادة تشغيل Nginx وتثبيت شهادة الأمان المجانية (Let's Encrypt SSL):

```bash
sudo ln -s /etc/nginx/sites-available/talago /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# تثبيت شهادة SSL مجانية وتلقائية التجديد
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## خطوة 5: التحقق والاختبار النهائي بعد النشر (Smoke Test)

بعد نجاح عملية النشر وظهور موقعك على الإنترنت، تأكد من إجراء الاختبارات التالية بنفسك للتأكد من ربط الواجهة بلوحة التحكم وقاعدة البيانات بنجاح تام:

1. **تسجيل مستخدم جديد أو تسجيل الدخول برابط سحري**:
   * ادخل على الموقع الحقيقي وضغط على **Sign In**.
   * اكتب بريدك الإلكتروني واطلب **Magic Link**.
   * تأكد من وصول الرسالة السحرية لإيميلك، وبمجرد الضغط على الرابط في إيميلك، يجب أن يوجهك مباشرة لصفحة `/my-bookings` على نطاقك الفعلي ويظهر إيميلك بوضوح في الأعلى.
2. **إنشاء حجز وهمي (Booking Flow)**:
   * اختر إحدى الرحلات واذهب لصفحة الدفع.
   * قم بملء البيانات بالكامل واختيار الدفع كاش عند الوصول (Pay Cash on Arrival) ثم اضغط **Confirm Booking**.
   * تأكد من ظهور صفحة نجاح الحجز وعرض رمز الحجز (مثل `TLG-XXXXXXXX-XXXX`) وتوافر كود الـ QR الخاص بالتذكرة.
3. **التحقق من لوحة تحكم المسؤولين (Admin Dashboard Connection)**:
   * ادخل على الرابط `/admin/login` وقم بكتابة توكن المسؤول الخاص بك (`ADMIN_API_TOKEN`) للدخول.
   * توجه لصفحة الحجوزات (`/admin/bookings`) وتأكد من أن الحجز الذي قمت به كعميل يظهر في أول القائمة ببياناتك الصحيحة.
   * جرب تغيير حالة الحجز من "معلق (PENDING)" إلى "مؤكد (CONFIRMED)" أو العكس للتأكد من تحديث الجداول بنجاح.
4. **التحقق من تواصل الموقع (واتساب وإشعارات)**:
   * إذا كنت قد قمت بربط Green-API، تحقق من هاتفك أو سجلات التنبيهات في لوحة المسؤولين للتأكد من إرسال رسالة التأكيد التلقائية.
