
const SUPABASE_URL =
    "https://qatsmrjbssvnohkptywe.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_iZwpVGWCxCUKxBJVv3D6DA_IG16Tr6u";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

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

let isSignUp = false;

function showMessage(text, success = false) {
    message.textContent = text;
    message.style.color = success ? "#d4af37" : "#ff7777";
}

function showDashboard(user) {
    authSection.classList.add("hidden");
    dashboard.classList.remove("hidden");
    userEmail.textContent = "ایمیل شما: " + user.email;
}

function showLogin() {
    dashboard.classList.add("hidden");
    authSection.classList.remove("hidden");
}

switchMode.addEventListener("click", () => {
    isSignUp = !isSignUp;

    formTitle.textContent = isSignUp
        ? "ساخت حساب کاربری"
        : "خوش آمدید";

    submitButton.textContent = isSignUp
        ? "ثبت نام"
        : "ورود به حساب";

    switchMode.textContent = isSignUp
        ? "حساب دارید؟ وارد شوید"
        : "حساب ندارید؟ ثبت‌نام کنید";

    showMessage("");
});

authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    submitButton.disabled = true;
    showMessage("لطفاً صبر کنید...", true);

    try {
        let result;

        if (isSignUp) {
            result = await supabaseClient.auth.signUp({
                email,
                password
            });

            if (result.error) throw result.error;

            if (result.data.session) {
                showDashboard(result.data.user);
                showMessage("ثبت‌نام موفق بود.", true);
            } else {
                showMessage(
                    "ثبت‌نام انجام شد. ایمیل خود را تأیید کنید.",
                    true
                );
            }

        } else {
            result = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (result.error) throw result.error;

            showDashboard(result.data.user);
            showMessage("با موفقیت وارد شدید.", true);
        }

    } catch (error) {
        showMessage("خطا: " + error.message);

    } finally {
        submitButton.disabled = false;
    }
});

logoutButton.addEventListener("click", async () => {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        showMessage("خطا در خروج: " + error.message);
        return;
    }

    authForm.reset();
    showLogin();
    showMessage("با موفقیت خارج شدید.", true);
});

async function checkLogin() {
    const { data, error } =
        await supabaseClient.auth.getSession();

    if (error || !data.session) {
        showLogin();
        return;
    }

    showDashboard(data.session.user);
}

checkLogin();
