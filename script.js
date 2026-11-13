
// ======================================
// تنظیمات اتصال به Supabase
// ======================================

const SUPABASE_URL = "https://qatsmrjbssvnohkptywe.supabase.co";

const SUPABASE_KEY = "sb_publishable_iZwpVGWCxCUKxBJVv3D6DA_IG16Tr6u";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// ======================================
// گرفتن عناصر صفحه
// ======================================

const authForm = document.getElementById("authForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitButton = document.getElementById("submitButton");
const switchMode = document.getElementById("switchMode");
const formTitle = document.getElementById("formTitle");
const message = document.getElementById("message");

const authSection = document.getElementById("authSection");
const dashboard = document.getElementById("dashboard");
const userEmail = document.getElementById("userEmail");
const logoutButton = document.getElementById("logoutButton");

// ======================================
// حالت ورود یا ثبت نام
// ======================================

let isSignUp = false;

switchMode.addEventListener("click", () => {
    isSignUp = !isSignUp;

    if (isSignUp) {
        formTitle.textContent = "ساخت حساب کاربری";
        submitButton.textContent = "ثبت نام";
        switchMode.textContent = "حساب دارید؟ وارد شوید";
    } else {
        formTitle.textContent = "ورود به حساب کاربری";
        submitButton.textContent = "ورود";
        switchMode.textContent = "حساب ندارید؟ ثبت‌نام کنید";
    }

    message.textContent = "";
});

// ======================================
// نمایش پیام
// ======================================

function showMessage(text, success = false) {
    message.textContent = text;
    message.style.color = success ? "#d4af37" : "#ff7777";
}

// ======================================
// نمایش صفحه شخصی
// ======================================

function showDashboard(user) {
    authSection.classList.add("hidden");
    dashboard.classList.remove("hidden");

    userEmail.textContent = "ایمیل شما: " + user.email;
}

// ======================================
// نمایش صفحه ورود
// ======================================

function showLogin() {
    dashboard.classList.add("hidden");
    authSection.classList.remove("hidden");
}

// ======================================
// ورود و ثبت نام
// ======================================

authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    submitButton.disabled = true;
    showMessage("لطفاً صبر کنید...", true);

    try {
        if (isSignUp) {

            const { data, error } =
                await supabaseClient.auth.signUp({
                    email: email,
                    password: password
                });

            if (error) throw error;

            if (data.session) {
                showDashboard(data.user);
                showMessage("حساب شما ساخته شد.", true);
            } else {
                showMessage(
                    "ثبت نام انجام شد. ایمیل خود را برای تأیید بررسی کنید.",
                    true
                );
            }

        } else {

            const { data, error } =
                await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });

            if (error) throw error;

            showDashboard(data.user);
        }

    } catch (error) {
        showMessage("خطا: " + error.message);
    } finally {
        submitButton.disabled = false;
    }
});

// ======================================
// خروج از حساب
// ======================================

logoutButton.addEventListener("click", async () => {

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        alert("خطا در خروج: " + error.message);
        return;
    }

    showLogin();
    authForm.reset();
    showMessage("با موفقیت خارج شدید.", true);
});

// ======================================
// بررسی وضعیت ورود هنگام باز شدن سایت
// ======================================

async function checkLogin() {
    const { data, error } =
        await supabaseClient.auth.getSession();

    if (error) {
        showLogin();
        return;
    }

    if (data.session) {
        showDashboard(data.session.user);
    } else {
        showLogin();
    }
}

// ======================================
// بررسی تغییر وضعیت حساب
// ======================================

supabaseClient.auth.onAuthStateChange((event, session) => {

    if (event === "SIGNED_IN" && session) {
        showDashboard(session.user);
    }

    if (event === "SIGNED_OUT") {
        showLogin();
    }
});

// شروع برنامه
checkLogin();
