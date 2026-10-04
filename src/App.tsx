import { useEffect, useMemo, useState } from "react";
import "./App.css";

type PresetType = "month" | "year" | "junior" | "high";

type Timer = {
id: string;
name: string;
target: string;
preset?: PresetType;
};

const BIRTHDAY_KEY = "kikikan-birthday";
const TIMERS_KEY = "kikikan-timers";
const ACTIVE_KEY = "kikikan-active";
const MILLISECONDS_KEY = "kikikan-milliseconds";

const PRESET_IDS = {
month: "preset-month",
year: "preset-year",
junior: "preset-junior",
high: "preset-high",
} as const;

function isTimer(value: unknown): value is Timer {
if (!value || typeof value !== "object") return false;

const item = value as Record<string, unknown>;

return (
typeof item.id === "string" &&
typeof item.name === "string" &&
typeof item.target === "string"
);
}

function getBirthday(): string {
return localStorage.getItem(BIRTHDAY_KEY) ?? "";
}

function getSchoolYear(birthday: string): number {
const date = new Date(`${birthday}T00:00:00`);
const year = date.getFullYear();
const month = date.getMonth() + 1;
const day = date.getDate();

if (month < 4 || (month === 4 && day === 1)) {
return year - 1;
}

return year;
}

function getPresetTimers(birthday: string): Timer[] {
const now = new Date();

const monthEnd = new Date(
now.getFullYear(),
now.getMonth() + 1,
0,
23,
59,
59,
999,
);

const yearEnd = new Date(
now.getFullYear(),
11,
31,
23,
59,
59,
999,
);

const presets: Timer[] = [
{
id: PRESET_IDS.month,
name: "月末まで",
target: monthEnd.toISOString(),
preset: "month",
},
{
id: PRESET_IDS.year,
name: "年末まで",
target: yearEnd.toISOString(),
preset: "year",
},
];

if (birthday) {
const schoolYear = getSchoolYear(birthday);

  
presets.push(
  {
    id: PRESET_IDS.junior,
    name: "中学校卒業まで",
    target: `${schoolYear + 15}-03-31T23:59:59.999`,
    preset: "junior",
  },
  {
    id: PRESET_IDS.high,
    name: "高校卒業まで",
    target: `${schoolYear + 18}-03-31T23:59:59.999`,
    preset: "high",
  },
);
  

}

return presets;
}

function getAge(birthday: string): number {
const birth = new Date(`${birthday}T00:00:00`);
const now = new Date();

let age = now.getFullYear() - birth.getFullYear();

const birthdayPassed =
now.getMonth() > birth.getMonth() ||
(now.getMonth() === birth.getMonth() &&
now.getDate() >= birth.getDate());

if (!birthdayPassed) {
age--;
}

return age;
}

function getGrade(birthday: string): string {
const birth = new Date(`${birthday}T00:00:00`);
const now = new Date();

const currentSchoolYear =
now.getFullYear() -
(now.getMonth() + 1 < 4 ? 1 : 0);

const birthSchoolYear = getSchoolYear(birthday);
const grade = currentSchoolYear - birthSchoolYear - 6;

if (grade >= 10 && grade <= 12) {
return `高校${grade - 9}年`;
}

if (grade >= 7 && grade <= 9) {
return `中学${grade - 6}年`;
}

if (grade >= 1 && grade <= 6) {
return `小学${grade}年`;
}

return "";
}

function getRemaining(target: string, now: number) {
const difference = Math.max(
0,
new Date(target).getTime() - now,
);

const totalSeconds = Math.floor(difference / 1000);

return {
days: Math.floor(totalSeconds / 86400),
hours: Math.floor((totalSeconds % 86400) / 3600),
minutes: Math.floor((totalSeconds % 3600) / 60),
seconds: totalSeconds % 60,
milliseconds: difference % 1000,
};
}

function formatNumber(value: number): string {
return String(value).padStart(2, "0");
}

function getElapsedPercent(
timer: Timer,
birthday: string,
now: number,
): number {
const target = new Date(timer.target).getTime();

if (!timer.preset) {
return 0;
}

let start = now;

if (timer.preset === "month") {
const date = new Date();

  
start = new Date(
  date.getFullYear(),
  date.getMonth(),
  1,
).getTime();
  

}

if (timer.preset === "year") {
const date = new Date();

  
start = new Date(
  date.getFullYear(),
  0,
  1,
).getTime();
  

}

if (
birthday &&
(timer.preset === "junior" ||
timer.preset === "high")
) {
const schoolYear = getSchoolYear(birthday);

  
start = new Date(
  timer.preset === "junior"
    ? schoolYear + 12
    : schoolYear + 15,
  3,
  1,
).getTime();
  

}

const total = target - start;

if (total <= 0) {
return 100;
}

return Math.min(
100,
Math.max(
0,
((now - start) / total) * 100,
),
);
}

export default function App() {
const [birthday, setBirthday] = useState(getBirthday);

const [draftBirthday, setDraftBirthday] =
useState(getBirthday);

const [timers, setTimers] = useState<Timer[]>(() => {
try {
const saved = localStorage.getItem(TIMERS_KEY);

  
  if (!saved) {
    return [];
  }

  const parsed: unknown = JSON.parse(saved);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(isTimer);
} catch {
  return [];
}
  

});

const [activeId, setActiveId] = useState(
() =>
localStorage.getItem(ACTIVE_KEY) ??
PRESET_IDS.month,
);

const [showMilliseconds, setShowMilliseconds] =
useState(
() =>
localStorage.getItem(
MILLISECONDS_KEY,
) !== "false",
);

const [now, setNow] = useState(Date.now());

const [showSettings, setShowSettings] =
useState(false);

const [showImport, setShowImport] =
useState(false);

const [importText, setImportText] =
useState("");

const [newName, setNewName] =
useState("");

const [newTarget, setNewTarget] =
useState("");

useEffect(() => {
const interval = window.setInterval(
() => {
setNow(Date.now());
},
showMilliseconds ? 50 : 500,
);

  
return () =>
  window.clearInterval(interval);
  

}, [showMilliseconds]);

useEffect(() => {
localStorage.setItem(
TIMERS_KEY,
JSON.stringify(timers),
);
}, [timers]);

useEffect(() => {
if (birthday) {
localStorage.setItem(
BIRTHDAY_KEY,
birthday,
);
}
}, [birthday]);

useEffect(() => {
localStorage.setItem(
ACTIVE_KEY,
activeId,
);
}, [activeId]);

useEffect(() => {
localStorage.setItem(
MILLISECONDS_KEY,
String(showMilliseconds),
);
}, [showMilliseconds]);

const presetTimers = useMemo(
() => getPresetTimers(birthday),
[birthday, now],
);

const customTimers = timers.filter(
(timer) => !timer.preset,
);

const allTimers = [
...presetTimers,
...customTimers,
];

const activeTimer =
allTimers.find(
(timer) => timer.id === activeId,
) ?? allTimers[0];

const remaining = activeTimer
? getRemaining(
activeTimer.target,
now,
)
: null;

const elapsedPercent =
activeTimer
? getElapsedPercent(
activeTimer,
birthday,
now,
)
: 0;

const saveBirthday = () => {
if (!draftBirthday) {
return;
}

  
setBirthday(draftBirthday);
setShowSettings(false);
  

};

const createTimer = () => {
const name = newName.trim();

  
if (!name || !newTarget) {
  return;
}

const targetTime =
  new Date(newTarget).getTime();

const duplicate = allTimers.some(
  (timer) =>
    timer.name === name ||
    new Date(timer.target).getTime() ===
      targetTime,
);

if (duplicate) {
  alert(
    "同じ名前、または同じ日時のタイマーは作成できません。",
  );
  return;
}

const timer: Timer = {
  id: `timer-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`,
  name,
  target: new Date(
    targetTime,
  ).toISOString(),
};

setTimers((current) => [
  ...current,
  timer,
]);

setActiveId(timer.id);
setNewName("");
setNewTarget("");
  

};

const deleteTimer = (id: string) => {
setTimers((current) =>
current.filter(
(timer) => timer.id !== id,
),
);

  
if (activeId === id) {
  setActiveId(
    PRESET_IDS.month,
  );
}
  

};

const exportTimers = () => {
const data = {
version: 1,
birthday,
timers: customTimers,
};

  
const blob = new Blob(
  [JSON.stringify(data, null, 2)],
  {
    type: "application/json",
  },
);

const url =
  URL.createObjectURL(blob);

const link =
  document.createElement("a");

link.href = url;
link.download =
  "kikikan-timer.json";
link.click();

URL.revokeObjectURL(url);
  

};

const importTimers = () => {
try {
const parsed: unknown =
JSON.parse(importText);

  
  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    throw new Error();
  }

  const data = parsed as {
    birthday?: unknown;
    timers?: unknown;
  };

  const imported = Array.isArray(
    data.timers,
  )
    ? data.timers.filter(isTimer)
    : [];

  const importedCustom =
    imported.filter(
      (timer) => !timer.preset,
    );

  setTimers((current) => {
    const result = [...current];

    for (const timer of importedCustom) {
      const duplicate =
        result.some(
          (existing) =>
            existing.name ===
              timer.name ||
            new Date(
              existing.target,
            ).getTime() ===
              new Date(
                timer.target,
              ).getTime(),
        );

      if (!duplicate) {
        result.push({
          ...timer,
          preset: undefined,
        });
      }
    }

    return result;
  });

  if (
    typeof data.birthday ===
      "string" &&
    data.birthday
  ) {
    setBirthday(
      data.birthday,
    );
    setDraftBirthday(
      data.birthday,
    );
  }

  setImportText("");
  setShowImport(false);
} catch {
  alert(
    "JSONを読み込めませんでした。",
  );
}
  

};

const resetBirthday = () => {
localStorage.removeItem(
BIRTHDAY_KEY,
);

  
setBirthday("");
setDraftBirthday("");
setShowSettings(false);
  

};

if (!birthday) {
return ( <main className="setup-page"> <div className="setup-card"> <div className="eyebrow">
KIKIKAN TIMER </div>

  
      <h1>危機感タイマー</h1>

      <p className="setup-description">
        あなたの時間を、
        <br />
        数字で見える化する。
      </p>

      <label className="input-label">
        生年月日
      </label>

      <input
        className="date-input"
        type="date"
        value={draftBirthday}
        onChange={(event) =>
          setDraftBirthday(
            event.target.value,
          )
        }
      />

      <button
        className="primary-button"
        disabled={!draftBirthday}
        onClick={() =>
          setBirthday(
            draftBirthday,
          )
        }
      >
        はじめる
      </button>
    </div>
  </main>
);
  

}

return ( <main className="app"> <header className="topbar"> <div> <div className="eyebrow">
KIKIKAN TIMER </div>

  
      <h1>危機感タイマー</h1>
    </div>

    <button
      className="settings-button"
      onClick={() => {
        setDraftBirthday(
          birthday,
        );
        setShowSettings(true);
      }}
    >
      設定
    </button>
  </header>

  <div className="profile">
    <span>
      {getAge(birthday)}歳
    </span>

    {getGrade(birthday) && (
      <span>
        {getGrade(birthday)}
      </span>
    )}
  </div>

  <section className="timer-selector">
    {presetTimers.map((timer) => (
      <button
        key={timer.id}
        className={
          timer.id === activeTimer?.id
            ? "timer-tab active"
            : "timer-tab"
        }
        onClick={() =>
          setActiveId(timer.id)
        }
      >
        {timer.name}
      </button>
    ))}

    {customTimers.map((timer) => (
      <button
        key={timer.id}
        className={
          timer.id === activeTimer?.id
            ? "timer-tab active custom-tab"
            : "timer-tab custom-tab"
        }
        onClick={() =>
          setActiveId(timer.id)
        }
      >
        {timer.name}
      </button>
    ))}
  </section>

  {activeTimer && remaining && (
    <section className="main-timer">
      <div className="timer-name">
        {activeTimer.name}
      </div>

      <div className="countdown">
        <div className="time-unit">
          <span className="time-number">
            {remaining.days}
          </span>

          <span className="time-label">
            DAYS
          </span>
        </div>

        <span className="separator">
          :
        </span>

        <div className="time-unit">
          <span className="time-number">
            {formatNumber(
              remaining.hours,
            )}
          </span>

          <span className="time-label">
            HOURS
          </span>
        </div>

        <span className="separator">
          :
        </span>

        <div className="time-unit">
          <span className="time-number">
            {formatNumber(
              remaining.minutes,
            )}
          </span>

          <span className="time-label">
            MIN
          </span>
        </div>

        <span className="separator">
          :
        </span>

        <div className="time-unit">
          <span className="time-number">
            {formatNumber(
              remaining.seconds,
            )}
          </span>

          <span className="time-label">
            SEC
          </span>
        </div>
      </div>

      {showMilliseconds && (
        <div className="milliseconds">
          .
          {String(
            remaining.milliseconds,
          ).padStart(3, "0")}
        </div>
      )}

      <div className="progress-info">
        <strong>
          {elapsedPercent.toFixed(4)}%
          経過
        </strong>

        <span>
          残り{" "}
          {(100 - elapsedPercent).toFixed(
            4,
          )}
          %
        </span>
      </div>

      <div className="progress">
        <div
          className="progress-bar"
          style={{
            width: `${elapsedPercent}%`,
          }}
        />
      </div>

      <div className="target">
        {new Date(
          activeTimer.target,
        ).toLocaleString("ja-JP", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </section>
  )}

  <section className="create-section">
    <div className="section-title">
      タイマーを追加
    </div>

    <div className="create-form">
      <input
        type="text"
        placeholder="タイマー名"
        value={newName}
        onChange={(event) =>
          setNewName(
            event.target.value,
          )
        }
      />

      <input
        type="datetime-local"
        value={newTarget}
        onChange={(event) =>
          setNewTarget(
            event.target.value,
          )
        }
      />

      <button
        className="primary-button"
        onClick={createTimer}
      >
        追加
      </button>
    </div>
  </section>

  {customTimers.length > 0 && (
    <section className="custom-list">
      <div className="section-title">
        マイタイマー
      </div>

      {customTimers.map((timer) => (
        <div
          className="custom-item"
          key={timer.id}
        >
          <button
            className="custom-name"
            onClick={() =>
              setActiveId(
                timer.id,
              )
            }
          >
            {timer.name}
          </button>

          <button
            className="delete-button"
            onClick={() =>
              deleteTimer(
                timer.id,
              )
            }
          >
            削除
          </button>
        </div>
      ))}
    </section>
  )}

  <section className="tools">
    <label className="switch-row">
      <input
        type="checkbox"
        checked={showMilliseconds}
        onChange={(event) =>
          setShowMilliseconds(
            event.target.checked,
          )
        }
      />

      <span>
        ミリ秒を表示
      </span>
    </label>

    <div className="tool-buttons">
      <button
        onClick={exportTimers}
      >
        JSONを書き出す
      </button>

      <button
        onClick={() =>
          setShowImport(true)
        }
      >
        JSONを読み込む
      </button>
    </div>
  </section>

  {showSettings && (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h2>設定</h2>

          <button
            onClick={() =>
              setShowSettings(false)
            }
          >
            ×
          </button>
        </div>

        <label className="input-label">
          生年月日
        </label>

        <input
          className="date-input"
          type="date"
          value={draftBirthday}
          onChange={(event) =>
            setDraftBirthday(
              event.target.value,
            )
          }
        />

        <div className="modal-info">
          <span>
            現在 {getAge(birthday)}歳
          </span>

          <span>
            {getGrade(birthday)}
          </span>
        </div>

        <div className="modal-actions">
          <button
            className="primary-button"
            onClick={saveBirthday}
          >
            保存
          </button>

          <button
            className="danger-button"
            onClick={resetBirthday}
          >
            生年月日をリセット
          </button>
        </div>
      </div>
    </div>
  )}

  {showImport && (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h2>
            JSONを読み込む
          </h2>

          <button
            onClick={() =>
              setShowImport(false)
            }
          >
            ×
          </button>
        </div>

        <textarea
          className="import-area"
          placeholder="JSONをここに貼り付け"
          value={importText}
          onChange={(event) =>
            setImportText(
              event.target.value,
            )
          }
        />

        <button
          className="primary-button"
          onClick={importTimers}
        >
          読み込む
        </button>
      </div>
    </div>
  )}
</main>
  

);
}
