
// ==========================================
// LUXURY TRUCK - MAIN APPLICATION
// ==========================================

const SUPABASE_URL = "https://qatsmrjbssvnohkptywe.supabase.co";
const SUPABASE_KEY = "sb_publishable_iZwpVGWCxCUKxBJVv3D6DA_IG16Tr6u";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let isSignUp = false;

// ==========================================
// ELEMENTS
// ==========================================

const $ = id => document.getElementById(id);

const authSection = $("authSection");
const dashboard = $("dashboard");
const authForm = $("authForm");
const message = $("message");

const pages = [
    "dashboard",
    "trucksPage",
    "maintenancePage",
    "financePage",
    "tasksPage",
    "notificationsPage"
];

// ==========================================
// GENERAL FUNCTIONS
// ==========================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function showMessage(text, success = false) {
    message.textContent = text;
    message.style.color = success ? "#d4af37" : "#ff7777";
}

function showPage(pageId) {
    pages.forEach(id => $(id)?.classList.add("hidden"));
    $(pageId)?.classList.remove("hidden");
}

function showLogin() {
    currentUser = null;
    pages.forEach(id => $(id)?.classList.add("hidden"));
    authSection.classList.remove("hidden");
}

function showDashboard(user) {
    currentUser = user;
    authSection.classList.add("hidden");
    showPage("dashboard");
    $("userEmail").textContent = "ایمیل شما: " + user.email;
    loadAllData();
}

function today() {
    return new Date().toISOString().slice(0, 10);
}

function money(value) {
    return Number(value || 0).toLocaleString("fa-IR");
}

function userId() {
    return currentUser.id;
}

function notify(title, text) {
    return db.from("notifications").insert({
        user_id: userId(),
        title,
        message: text
    });
}

function showError(error) {
    alert("خطا: " + (error?.message || "مشکلی رخ داد"));
}

async function getRows(table) {
    const { data, error } = await db
        .from(table)
        .select("*")
        .eq("user_id", userId())
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
}

async function deleteRow(table, id) {
    if (!confirm("آیا از حذف این مورد مطمئن هستید؟")) return;

    const { error } = await db
        .from(table)
        .delete()
        .eq("id", id)
        .eq("user_id", userId());

    if (error) return showError(error);

    await loadAllData();
}

// ==========================================
// AUTHENTICATION
// ==========================================

$("switchMode").addEventListener("click", () => {
    isSignUp = !isSignUp;

    $("formTitle").textContent = isSignUp
        ? "ساخت حساب کاربری"
        : "خوش آمدید";

    $("submitButton").textContent = isSignUp
        ? "ثبت نام"
        : "ورود به حساب";

    $("switchMode").textContent = isSignUp
        ? "حساب دارید؟ وارد شوید"
        : "حساب ندارید؟ ثبت‌نام کنید";

    showMessage("");
});

authForm.addEventListener("submit", async event => {
    event.preventDefault();

    const email = $("email").value.trim();
    const password = $("password").value;

    $("submitButton").disabled = true;
    showMessage("لطفاً صبر کنید...", true);

    try {
        if (isSignUp) {
            const { data, error } = await db.auth.signUp({
                email,
                password
            });

            if (error) throw error;

            if (data.session) {
                showDashboard(data.user);
            } else {
                showMessage(
                    "ثبت‌نام انجام شد. اگر تأیید ایمیل فعال است، ایمیل خود را بررسی کنید.",
                    true
                );
            }
        } else {
            const { data, error } = await db.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            showDashboard(data.user);
        }
    } catch (error) {
        showMessage("خطا: " + error.message);
    } finally {
        $("submitButton").disabled = false;
    }
});

$("logoutButton").addEventListener("click", async () => {
    const { error } = await db.auth.signOut();

    if (error) return showError(error);

    authForm.reset();
    showLogin();
});

db.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) {
        showDashboard(session.user);
    }

    if (event === "SIGNED_OUT") {
        showLogin();
    }
});

async function checkLogin() {
    const { data, error } = await db.auth.getSession();

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

// ==========================================
// NAVIGATION
// ==========================================

document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
        const page = button.dataset.page;
        showPage(page);
        loadAllData();
    });
});

document.querySelectorAll(".backButton").forEach(button => {
    button.addEventListener("click", () => showPage("dashboard"));
});

// ==========================================
// TRUCKS
// ==========================================

$("truckForm").addEventListener("submit", async event => {
    event.preventDefault();

    try {
        const { error } = await db.from("trucks").insert({
            user_id: userId(),
            name: $("truckName").value.trim(),
            brand: $("truckBrand").value,
            model: $("truckModel").value.trim(),
            plate_number: $("truckPlate").value.trim(),
            mileage: Number($("truckMileage").value || 0)
        });

        if (error) throw error;

        $("truckForm").reset();
        await notify("کامیون جدید", "یک کامیون به ناوگان اضافه شد.");
        await loadAllData();
        alert("کامیون با موفقیت ثبت شد.");
    } catch (error) {
        showError(error);
    }
});

async function loadTrucks() {
    const trucks = await getRows("trucks");

    $("trucksList").innerHTML = trucks.length
        ? trucks.map(t => `
            <div class="record-item">
                <strong>${escapeHTML(t.name)}</strong><br>
                برند: ${escapeHTML(t.brand)}<br>
                مدل: ${escapeHTML(t.model || "-")}<br>
                پلاک: ${escapeHTML(t.plate_number || "-")}<br>
                کیلومتر: ${money(t.mileage)}
                <br>
                <button data-delete="trucks" data-id="${t.id}">حذف</button>
            </div>
        `).join("")
        : "<p>هنوز کامیونی ثبت نشده است.</p>";

    const options = trucks.map(t => `
        <option value="${t.id}">${escapeHTML(t.name)}</option>
    `).join("");

    ["maintenanceTruck", "transactionTruck", "taskTruck"].forEach(id => {
        $(id).innerHTML = '<option value="">انتخاب کامیون</option>' + options;
    });
}

// ==========================================
// MAINTENANCE
// ==========================================

$("maintenanceForm").addEventListener("submit", async event => {
    event.preventDefault();

    try {
        const { error } = await db.from("maintenance").insert({
            user_id: userId(),
            truck_id: $("maintenanceTruck").value || null,
            title: $("maintenanceTitle").value.trim(),
            service_date: $("maintenanceDate").value || null,
            next_service_date: $("maintenanceNextDate").value || null,
            cost: Number($("maintenanceCost").value || 0),
            description: $("maintenanceDescription").value.trim(),
            status: "pending"
        });

        if (error) throw error;

        $("maintenanceForm").reset();
        await notify("تعمیر جدید ثبت شد", $("maintenanceTitle").value);
        await loadAllData();
        alert("تعمیر با موفقیت ثبت شد.");
    } catch (error) {
        showError(error);
    }
});

async function loadMaintenance() {
    const rows = await getRows("maintenance");

    $("maintenanceList").innerHTML = rows.length
        ? rows.map(r => `
            <div class="record-item">
                <strong>${escapeHTML(r.title)}</strong><br>
                تاریخ تعمیر: ${escapeHTML(r.service_date || "-")}<br>
                سرویس بعدی: ${escapeHTML(r.next_service_date || "-")}<br>
                هزینه: ${money(r.cost)}
                <br>
                <button data-delete="maintenance" data-id="${r.id}">حذف</button>
            </div>
        `).join("")
        : "<p>هنوز تعمیری ثبت نشده است.</p>";
}

// ==========================================
// ACCOUNTING
// ==========================================

$("transactionForm").addEventListener("submit", async event => {
    event.preventDefault();

    try {
        const type = $("transactionType").value;
        const title = $("transactionTitle").value.trim();

        const { error } = await db.from("transactions").insert({
            user_id: userId(),
            truck_id: $("transactionTruck").value || null,
            type,
            title,
            amount: Number($("transactionAmount").value),
            transaction_date: $("transactionDate").value || today(),
            description: $("transactionDescription").value.trim()
        });

        if (error) throw error;

        $("transactionForm").reset();
        await notify("تراکنش جدید", title);
        await loadAllData();
        alert("تراکنش ثبت شد.");
    } catch (error) {
        showError(error);
    }
});

async function loadFinance() {
    const rows = await getRows("transactions");

    const income = rows
        .filter(r => r.type === "income")
        .reduce((sum, r) => sum + Number(r.amount), 0);

    const expense = rows
        .filter(r => r.type === "expense")
        .reduce((sum, r) => sum + Number(r.amount), 0);

    $("totalIncome").textContent = money(income);
    $("totalExpense").textContent = money(expense);
    $("totalProfit").textContent = money(income - expense);

    $("transactionsList").innerHTML = rows.length
        ? rows.map(r => `
            <div class="record-item">
                <strong>${escapeHTML(r.title)}</strong><br>
                نوع: ${r.type === "income" ? "درآمد" : "هزینه"}<br>
                مبلغ: ${money(r.amount)}<br>
                تاریخ: ${escapeHTML(r.transaction_date || "-")}
                <br>
                <button data-delete="transactions" data-id="${r.id}">حذف</button>
            </div>
        `).join("")
        : "<p>هنوز تراکنشی ثبت نشده است.</p>";
}

// ==========================================
// DAILY TASKS
// ==========================================

$("taskForm").addEventListener("submit", async event => {
    event.preventDefault();

    try {
        const title = $("taskTitle").value.trim();

        const { error } = await db.from("daily_tasks").insert({
            user_id: userId(),
            truck_id: $("taskTruck").value || null,
            title,
            task_date: $("taskDate").value,
            task_time: $("taskTime").value || null,
            description: $("taskDescription").value.trim(),
            completed: false
        });

        if (error) throw error;

        $("taskForm").reset();
        await notify("برنامه جدید", title);
        await loadAllData();
        alert("برنامه ثبت شد.");
    } catch (error) {
        showError(error);
    }
});

async function loadTasks() {
    const rows = await getRows("daily_tasks");

    $("tasksList").innerHTML = rows.length
        ? rows.map(r => `
            <div class="record-item">
                <strong>${escapeHTML(r.title)}</strong><br>
                تاریخ: ${escapeHTML(r.task_date)}<br>
                ساعت: ${escapeHTML(r.task_time || "-")}<br>
                وضعیت: ${r.completed ? "انجام شده" : "در انتظار"}
                <br>
                <button data-complete="${r.id}">
                    ${r.completed ? "بازگرداندن" : "انجام شد"}
                </button>
                <button data-delete="daily_tasks" data-id="${r.id}">حذف</button>
            </div>
        `).join("")
        : "<p>برنامه‌ای ثبت نشده است.</p>";
}

// ==========================================
// NOTIFICATIONS
// ==========================================

async function loadNotifications() {
    const rows = await getRows("notifications");

    $("notificationsList").innerHTML = rows.length
        ? rows.map(r => `
            <div class="record-item">
                <strong>${escapeHTML(r.title)}</strong><br>
                ${escapeHTML(r.message || "")}<br>
                <small>${escapeHTML(new Date(r.created_at).toLocaleString("fa-IR"))}</small>
                <br>
                <button data-read="${r.id}">
                    ${r.is_read ? "خوانده شده" : "علامت‌گذاری به‌عنوان خوانده‌شده"}
                </button>
                <button data-delete="notifications" data-id="${r.id}">حذف</button>
            </div>
        `).join("")
        : "<p>اعلانی وجود ندارد.</p>";
}

// ==========================================
// BUTTON ACTIONS
// ==========================================

document.addEventListener("click", async event => {
    const deleteButton = event.target.closest("[data-delete]");

    if (deleteButton) {
        return deleteRow(
            deleteButton.dataset.delete,
            deleteButton.dataset.id
        );
    }

    const completeButton = event.target.closest("[data-complete]");

    if (completeButton) {
        const { data, error } = await db
            .from("daily_tasks")
            .select("completed")
            .eq("id", completeButton.dataset.complete)
            .eq("user_id", userId())
            .single();

        if (error) return showError(error);

        const result = await db.from("daily_tasks")
            .update({ completed: !data.completed })
            .eq("id", completeButton.dataset.complete)
            .eq("user_id", userId());

        if (result.error) return showError(result.error);
        return loadTasks();
    }

    const readButton = event.target.closest("[data-read]");

    if (readButton) {
        const { error } = await db.from("notifications")
            .update({ is_read: true })
            .eq("id", readButton.dataset.read)
            .eq("user_id", userId());

        if (error) return showError(error);
        return loadNotifications();
    }
});

// ==========================================
// LOAD ALL DATA
// ==========================================

async function loadAllData() {
    if (!currentUser) return;

    try {
        await loadTrucks();
        await loadMaintenance();
        await loadFinance();
        await loadTasks();
        await loadNotifications();
    } catch (error) {
        showError(error);
    }
}

// ==========================================
// START
// ==========================================

checkLogin();
