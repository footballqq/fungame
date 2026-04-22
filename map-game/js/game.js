(function () {
  "use strict";

  const Utils = window.MapGameUtils;
  const APP_VERSION = "v2026.02.20.20";
  const TOTAL_QUESTIONS = 10;
  const AUTO_NEXT_DELAY_MS = 2000;
  const WORLD_COUNTRY_MIN_AREA = 0.0004;
  const MAP_SCALE_STEPS = [1, 2, 3, 5, 8, 12];
  const MAP_SCALE_LABELS = ["标准", "+100%", "+200%", "+400%", "+700%", "+1100%"];
  const MAP_PAN_STEP_PX = 120;
  const WORLD_CITY_SCORE_WEIGHTS = {
    countryGDP: 0.5,
    cityFame: 0.42,
    cityType: 0.08,
  };
  const WORLD_CITY_REGION_MINIMUMS = {
    top50: {
      Africa: 3,
      Americas: 8,
      Asia: 11,
      Europe: 11,
      Oceania: 2,
    },
    top200: {
      Africa: 12,
      Americas: 22,
      Asia: 34,
      Europe: 34,
      Oceania: 5,
    },
  };
  const WORLD_CITY_COUNTRY_BLOCKLIST = new Set([
    "bouvetisland",
    "frenchsouthernandantarcticlands",
    "unitedstatesminoroutlyingislands",
    "caribbeannetherlands",
    "britishindianoceanterritory",
    "cocoskeelingislands",
    "christmasisland",
    "pitcairnislands",
    "tokelau",
    "wallisandfutuna",
    "southgeorgia",
    "svalbardandjanmayen",
    "saintpierreandmiquelon",
    "frenchpolynesia",
    "guadeloupe",
    "martinique",
    "reunion",
    "mayotte",
    "guam",
    "northernmarianaislands",
    "americansamoa",
    "cookislands",
    "niue",
    "turksandcaicosislands",
    "caymanislands",
    "montserrat",
    "anguilla",
    "aruba",
    "curacao",
    "sintmaarten",
    "faroeislands",
    "gibraltar",
    "isleofman",
    "jersey",
    "guernsey",
    "alandislands",
    "britishvirginislands",
    "unitedstatesvirginislands",
    "falklandislands",
  ]);
  const CITY_FAME_SCORE_MAP = {
    newyork: 1.0,
    london: 1.0,
    paris: 0.99,
    tokyo: 0.99,
    beijing: 0.98,
    shanghai: 0.98,
    hongkong: 0.98,
    singapore: 0.98,
    dubai: 0.97,
    losangeles: 0.97,
    sanfrancisco: 0.96,
    chicago: 0.95,
    toronto: 0.94,
    vancouver: 0.92,
    montreal: 0.91,
    mexicocity: 0.95,
    saopaulo: 0.95,
    riodejaneiro: 0.93,
    buenosaires: 0.93,
    delhi: 0.95,
    mumbai: 0.95,
    bangkok: 0.94,
    seoul: 0.96,
    madrid: 0.94,
    barcelona: 0.94,
    berlin: 0.94,
    rome: 0.93,
    milan: 0.91,
    amsterdam: 0.92,
    brussels: 0.89,
    vienna: 0.9,
    prague: 0.88,
    warsaw: 0.87,
    budapest: 0.86,
    athens: 0.86,
    zurich: 0.89,
    geneva: 0.88,
    stockholm: 0.88,
    oslo: 0.86,
    copenhagen: 0.87,
    helsinki: 0.84,
    dublin: 0.85,
    lisbon: 0.86,
    moscow: 0.94,
    istanbul: 0.94,
    cairo: 0.93,
    johannesburg: 0.91,
    lagos: 0.9,
    nairobi: 0.87,
    casablanca: 0.85,
    addisababa: 0.83,
    sydney: 0.94,
    melbourne: 0.91,
    auckland: 0.86,
    wellington: 0.8,
    tehran: 0.89,
    riyadh: 0.89,
    jeddah: 0.82,
    doha: 0.83,
    abudhabi: 0.88,
    karachi: 0.88,
    jakarta: 0.92,
    manila: 0.89,
    hochiminhcity: 0.86,
    hanoi: 0.84,
    osaka: 0.9,
    kyoto: 0.8,
    wuhan: 0.84,
    guangzhou: 0.9,
    shenzhen: 0.9,
    chongqing: 0.84,
    tianjin: 0.82,
    chengdu: 0.85,
    xian: 0.82,
    hangzhou: 0.84,
    nanjing: 0.82,
  };
  const CITY_CHALLENGE_EXCLUDED_PROVINCES = new Set([
    "北京市",
    "天津市",
    "上海市",
    "重庆市",
    "香港特别行政区",
    "澳门特别行政区",
    "台湾省",
  ]);
  const CHINA_SECONDARY_CITIES = [
    { province: "河北省", name: "唐山市", lat: 39.6305, lon: 118.1806 },
    { province: "山西省", name: "大同市", lat: 40.0768, lon: 113.3001 },
    { province: "内蒙古自治区", name: "包头市", lat: 40.6574, lon: 109.8404 },
    { province: "辽宁省", name: "大连市", lat: 38.914, lon: 121.6147 },
    { province: "吉林省", name: "吉林市", lat: 43.8378, lon: 126.5496 },
    { province: "黑龙江省", name: "齐齐哈尔市", lat: 47.3543, lon: 123.9182 },
    { province: "江苏省", name: "苏州市", lat: 31.2989, lon: 120.5853 },
    { province: "浙江省", name: "宁波市", lat: 29.8683, lon: 121.544 },
    { province: "安徽省", name: "芜湖市", lat: 31.3525, lon: 118.4331 },
    { province: "福建省", name: "厦门市", lat: 24.4798, lon: 118.0894 },
    { province: "江西省", name: "赣州市", lat: 25.8311, lon: 114.9359 },
    { province: "山东省", name: "青岛市", lat: 36.0671, lon: 120.3826 },
    { province: "河南省", name: "洛阳市", lat: 34.6197, lon: 112.454 },
    { province: "湖北省", name: "宜昌市", lat: 30.6919, lon: 111.2865 },
    { province: "湖南省", name: "衡阳市", lat: 26.9004, lon: 112.5719 },
    { province: "广东省", name: "深圳市", lat: 22.5431, lon: 114.0579 },
    { province: "广西壮族自治区", name: "桂林市", lat: 25.2741, lon: 110.2991 },
    { province: "海南省", name: "三亚市", lat: 18.2528, lon: 109.5119 },
    { province: "四川省", name: "绵阳市", lat: 31.4675, lon: 104.6796 },
    { province: "贵州省", name: "遵义市", lat: 27.7257, lon: 106.9272 },
    { province: "云南省", name: "曲靖市", lat: 25.4902, lon: 103.7963 },
    { province: "西藏自治区", name: "日喀则市", lat: 29.2673, lon: 88.8812 },
    { province: "陕西省", name: "榆林市", lat: 38.2858, lon: 109.7341 },
    { province: "甘肃省", name: "天水市", lat: 34.5809, lon: 105.7249 },
    { province: "青海省", name: "海东市", lat: 36.4821, lon: 102.4102 },
    { province: "宁夏回族自治区", name: "吴忠市", lat: 37.9975, lon: 106.1986 },
    { province: "新疆维吾尔自治区", name: "喀什市", lat: 39.4677, lon: 75.9898 },
  ];
  const CHINA_PROVINCE_CAPITAL_CITY_MAP = {
    河北省: "石家庄市",
    山西省: "太原市",
    内蒙古自治区: "呼和浩特市",
    辽宁省: "沈阳市",
    吉林省: "长春市",
    黑龙江省: "哈尔滨市",
    江苏省: "南京市",
    浙江省: "杭州市",
    安徽省: "合肥市",
    福建省: "福州市",
    江西省: "南昌市",
    山东省: "济南市",
    河南省: "郑州市",
    湖北省: "武汉市",
    湖南省: "长沙市",
    广东省: "广州市",
    广西壮族自治区: "南宁市",
    海南省: "海口市",
    四川省: "成都市",
    贵州省: "贵阳市",
    云南省: "昆明市",
    西藏自治区: "拉萨市",
    陕西省: "西安市",
    甘肃省: "兰州市",
    青海省: "西宁市",
    宁夏回族自治区: "银川市",
    新疆维吾尔自治区: "乌鲁木齐市",
  };
  const COUNTRY_NAME_ALIASES = {
    unitedstatesofamerica: "unitedstates",
    unitedstates: "unitedstatesofamerica",
    uae: "unitedarabemirates",
    russia: "russianfederation",
    syria: "syrianarabrepublic",
    vietnam: "vietnam",
    laos: "laopeoplesdemocraticrepublic",
    bolivia: "boliviaplurinationalstateof",
    moldova: "moldovarepublicof",
    iran: "iranislamicrepublicof",
    venezuela: "venezuelabolivarianrepublicof",
    tanzania: "tanzaniaunitedrepublicof",
    koreademrep: "koreademocraticpeoplesrepublicof",
    northkorea: "koreademocraticpeoplesrepublicof",
    southkorea: "korearepublicof",
    republicofkorea: "korearepublicof",
    czechia: "czechrepublic",
    drcongo: "congothedemocraticrepublicofthe",
    democraticrepublicofthecongo: "congothedemocraticrepublicofthe",
    palestine: "stateofpalestine",
    thebahamas: "bahamas",
    macedonia: "northmacedonia",
  };
  const STORAGE_KEYS = {
    records: "map-game-records",
    assistTools: "map-game-assist-tools",
  };

  const MODE_CONFIG = {
    "province-click": {
      title: "省份大挑战",
      scope: "china",
      type: "province",
    },
    "city-click": {
      title: "省会定位",
      scope: "china",
      type: "city",
    },
    "world-province": {
      title: "世界国家挑战",
      scope: "world",
      type: "province",
    },
    "world-city": {
      title: "世界城市定位",
      scope: "world",
      type: "city",
    },
  };

  const state = {
    mode: null,
    currentQuestion: 0,
    totalQuestions: TOTAL_QUESTIONS,
    score: 0,
    accuracy: 0,
    totalDistance: 0,
    currentTarget: null,
    questions: [],
    history: [],
    awaitingAnswer: false,

    dataReady: false,
    settings: {
      provinceDifficulty: "easy",
      cityDifficulty: "easy",
      worldCountryDifficulty: "all",
      worldCityDifficulty: "top200",
      showAssistTools: false,
    },
    data: {
      chinaProvinces: null,
      chinaCities: [],
      worldCountries: null,
      worldCities: [],
      countryLabels: new Map(),
      countryMetricsByName: new Map(),
      countryIso3Metrics: new Map(),
      countryNameToIso3: new Map(),
      worldCityValidation: null,
    },

    mapContext: null,
    reviewMapContext: null,
    activeGeoJson: null,
    downPoint: null,
    downTransform: null,
    touchPointers: new Set(),
    touchGestureDetected: false,
    autoNextTimer: null,
    viewScaleIndex: 0,
    recentQuestionKeysByMode: {},
    records: {},
    dev: {
      enabled: false,
      logs: [],
      maxLogs: 300,
    },
  };

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    renderVersion();
    loadRecords();
    renderRecords();
    initSettings();
    bindEvents();
    initDevTools();
    setModeButtonsDisabled(true);
    loadData();
  }

  function cacheElements() {
    els.homePage = document.getElementById("home-page");
    els.gamePage = document.getElementById("game-page");
    els.resultPage = document.getElementById("result-page");

    els.modeButtons = Array.from(
      document.querySelectorAll('#mode-selection button[data-mode]')
    );
    els.provinceDifficulty = document.getElementById("province-difficulty");
    els.cityDifficulty = document.getElementById("city-difficulty");
    els.worldCountryDifficulty = document.getElementById("world-country-difficulty");
    els.worldCityDifficulty = document.getElementById("world-city-difficulty");

    els.loadingText = document.getElementById("loading-text");
    els.errorText = document.getElementById("error-text");

    els.modeTitle = document.getElementById("mode-title");
    els.question = document.getElementById("question");
    els.progress = document.getElementById("progress");
    els.liveScore = document.getElementById("live-score");
    els.feedback = document.getElementById("feedback");

    els.mapContainer = document.getElementById("map-container");
    els.viewScaleBtn = document.getElementById("view-scale-btn");
    els.mapResetBtn = document.getElementById("map-reset-btn");
    els.panUpBtn = document.getElementById("pan-up-btn");
    els.panLeftBtn = document.getElementById("pan-left-btn");
    els.panDownBtn = document.getElementById("pan-down-btn");
    els.panRightBtn = document.getElementById("pan-right-btn");
    els.assistToggleBtn = document.getElementById("assist-toggle-btn");
    els.assistTools = document.getElementById("assist-tools");
    els.nextBtn = document.getElementById("next-btn");
    els.quitBtn = document.getElementById("quit-btn");

    els.scoreText = document.getElementById("score-text");
    els.details = document.getElementById("details");
    els.mapReview = document.getElementById("map-review");
    els.historyList = document.getElementById("history-list");
    els.shareBtn = document.getElementById("share-btn");
    els.restartBtn = document.getElementById("restart-btn");
    els.homeBtn = document.getElementById("home-btn");
    els.homeVersion = document.getElementById("home-version");
    els.gameVersion = document.getElementById("game-version");
    els.resultVersion = document.getElementById("result-version");
    els.recordsContent = document.getElementById("records-content");

    els.devTools = document.getElementById("dev-tools");
    els.devLogOutput = document.getElementById("dev-log-output");
    els.devCopyBtn = document.getElementById("dev-copy-btn");
    els.devClearBtn = document.getElementById("dev-clear-btn");
    els.devToggleBtn = document.getElementById("dev-toggle-btn");
  }

  function bindEvents() {
    els.modeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.mode;
        if (MODE_CONFIG[mode]) {
          startGame(mode);
        }
      });
    });

    els.nextBtn.addEventListener("click", handleNext);
    els.quitBtn.addEventListener("click", showHome);
    els.homeBtn.addEventListener("click", showHome);
    els.restartBtn.addEventListener("click", () => {
      if (state.mode) {
        startGame(state.mode);
      } else {
        showHome();
      }
    });
    if (els.shareBtn) {
      els.shareBtn.addEventListener("click", shareResult);
    }

    if (els.provinceDifficulty) {
      els.provinceDifficulty.addEventListener("change", () => {
        const value = els.provinceDifficulty.value === "hard" ? "hard" : "easy";
        state.settings.provinceDifficulty = value;
        window.localStorage.setItem("map-game-province-difficulty", value);
      });
    }

    if (els.cityDifficulty) {
      els.cityDifficulty.addEventListener("change", () => {
        const value = ["easy", "hard", "super"].includes(els.cityDifficulty.value)
          ? els.cityDifficulty.value
          : "easy";
        state.settings.cityDifficulty = value;
        window.localStorage.setItem("map-game-city-difficulty", value);
      });
    }

    if (els.worldCountryDifficulty) {
      els.worldCountryDifficulty.addEventListener("change", () => {
        const value = els.worldCountryDifficulty.value === "top50" ? "top50" : "all";
        state.settings.worldCountryDifficulty = value;
        window.localStorage.setItem("map-game-world-country-difficulty", value);
      });
    }

    if (els.worldCityDifficulty) {
      els.worldCityDifficulty.addEventListener("change", () => {
        const value = els.worldCityDifficulty.value === "top50" ? "top50" : "top200";
        state.settings.worldCityDifficulty = value;
        window.localStorage.setItem("map-game-world-city-difficulty", value);
      });
    }

    if (els.viewScaleBtn) {
      els.viewScaleBtn.addEventListener("click", cycleMapScale);
    }
    if (els.mapResetBtn) {
      els.mapResetBtn.addEventListener("click", resetGameMapView);
    }
    if (els.panUpBtn) {
      els.panUpBtn.addEventListener("click", () => panGameMap(0, -MAP_PAN_STEP_PX));
    }
    if (els.panDownBtn) {
      els.panDownBtn.addEventListener("click", () => panGameMap(0, MAP_PAN_STEP_PX));
    }
    if (els.panLeftBtn) {
      els.panLeftBtn.addEventListener("click", () => panGameMap(-MAP_PAN_STEP_PX, 0));
    }
    if (els.panRightBtn) {
      els.panRightBtn.addEventListener("click", () => panGameMap(MAP_PAN_STEP_PX, 0));
    }
    if (els.assistToggleBtn) {
      els.assistToggleBtn.addEventListener("click", () => {
        setAssistToolsVisible(!state.settings.showAssistTools, true);
      });
    }

    if (els.devCopyBtn) {
      els.devCopyBtn.addEventListener("click", copyDevLogs);
    }
    if (els.devClearBtn) {
      els.devClearBtn.addEventListener("click", clearDevLogs);
    }
    if (els.devToggleBtn) {
      els.devToggleBtn.addEventListener("click", () => {
        setDevMode(!state.dev.enabled, true);
      });
    }
    document.addEventListener("keydown", (event) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        setDevMode(!state.dev.enabled, true);
      }
    });
  }

  function initDevTools() {
    const enabledByQuery = /(?:\?|&)devlog=1(?:&|$)/.test(window.location.search);
    const enabledByStorage = window.localStorage.getItem("map-game-devlog") === "1";
    setDevMode(enabledByQuery || enabledByStorage, false);
  }

  function renderVersion() {
    const text = `版本：${APP_VERSION}`;
    if (els.homeVersion) {
      els.homeVersion.textContent = text;
    }
    if (els.gameVersion) {
      els.gameVersion.textContent = text;
    }
    if (els.resultVersion) {
      els.resultVersion.textContent = text;
    }
  }

  function initSettings() {
    const cached = window.localStorage.getItem("map-game-province-difficulty");
    state.settings.provinceDifficulty = cached === "hard" ? "hard" : "easy";
    if (els.provinceDifficulty) {
      els.provinceDifficulty.value = state.settings.provinceDifficulty;
    }

    const cachedCity = window.localStorage.getItem("map-game-city-difficulty");
    state.settings.cityDifficulty = ["easy", "hard", "super"].includes(cachedCity)
      ? cachedCity
      : "easy";
    if (els.cityDifficulty) {
      els.cityDifficulty.value = state.settings.cityDifficulty;
    }

    const cachedWorldCountry = window.localStorage.getItem(
      "map-game-world-country-difficulty"
    );
    state.settings.worldCountryDifficulty =
      cachedWorldCountry === "top50" ? "top50" : "all";
    if (els.worldCountryDifficulty) {
      els.worldCountryDifficulty.value = state.settings.worldCountryDifficulty;
    }

    const cachedWorldCity = window.localStorage.getItem("map-game-world-city-difficulty");
    state.settings.worldCityDifficulty = cachedWorldCity === "top50" ? "top50" : "top200";
    if (els.worldCityDifficulty) {
      els.worldCityDifficulty.value = state.settings.worldCityDifficulty;
    }

    state.settings.showAssistTools =
      window.localStorage.getItem(STORAGE_KEYS.assistTools) === "1";
    setAssistToolsVisible(state.settings.showAssistTools, false);

    syncMapScaleButton();
  }

  function setAssistToolsVisible(flag, persist) {
    const visible = !!flag;
    state.settings.showAssistTools = visible;

    if (els.assistTools) {
      els.assistTools.classList.toggle("hidden", !visible);
    }
    if (els.assistToggleBtn) {
      els.assistToggleBtn.textContent = visible ? "隐藏辅助键" : "显示辅助键";
      els.assistToggleBtn.setAttribute("aria-expanded", visible ? "true" : "false");
    }

    if (persist !== false) {
      window.localStorage.setItem(STORAGE_KEYS.assistTools, visible ? "1" : "0");
    }
  }

  function syncMapScaleButton() {
    if (!els.viewScaleBtn) {
      return;
    }
    const index = Math.max(0, Math.min(MAP_SCALE_STEPS.length - 1, state.viewScaleIndex || 0));
    const label = MAP_SCALE_LABELS[index] || "标准";
    els.viewScaleBtn.textContent = `倍率：${label}`;
  }

  function applyMapScaleIndex(index) {
    const clampedIndex = Math.max(0, Math.min(MAP_SCALE_STEPS.length - 1, index));
    state.viewScaleIndex = clampedIndex;
    syncMapScaleButton();
    if (state.mapContext && typeof state.mapContext.zoomToScale === "function") {
      state.mapContext.zoomToScale(MAP_SCALE_STEPS[clampedIndex]);
    }
  }

  function cycleMapScale() {
    const next = ((state.viewScaleIndex || 0) + 1) % MAP_SCALE_STEPS.length;
    applyMapScaleIndex(next);
  }

  function resetGameMapView() {
    if (state.mapContext && typeof state.mapContext.resetView === "function") {
      state.mapContext.resetView();
    }
    state.viewScaleIndex = 0;
    syncMapScaleButton();
  }

  function panGameMap(dx, dy) {
    if (state.mapContext && typeof state.mapContext.panBy === "function") {
      state.mapContext.panBy(dx, dy);
    }
  }

  function setDevMode(flag, persist) {
    state.dev.enabled = !!flag;
    if (persist !== false) {
      window.localStorage.setItem("map-game-devlog", state.dev.enabled ? "1" : "0");
    }
    if (els.devTools) {
      els.devTools.classList.toggle("hidden", !state.dev.enabled);
    }
    renderDevLogs();
    if (state.dev.enabled) {
      addDevLog("system", {
        message: "开发日志已开启（可用 Ctrl+Shift+D 开关）",
      });
    }
  }

  function addDevLog(type, payload) {
    if (!state.dev.enabled) {
      return;
    }
    const entry = {
      time: new Date().toISOString(),
      mode: state.mode || null,
      index: state.currentQuestion + 1,
      type,
      payload: payload || {},
    };
    state.dev.logs.push(entry);
    if (state.dev.logs.length > state.dev.maxLogs) {
      state.dev.logs.splice(0, state.dev.logs.length - state.dev.maxLogs);
    }
    renderDevLogs();
  }

  function renderDevLogs() {
    if (!els.devLogOutput) {
      return;
    }
    els.devLogOutput.value = state.dev.logs
      .map((item) => JSON.stringify(item))
      .join("\n");
    els.devLogOutput.scrollTop = els.devLogOutput.scrollHeight;
  }

  async function copyDevLogs() {
    if (!els.devLogOutput) {
      return;
    }
    const text = els.devLogOutput.value || "";
    try {
      await navigator.clipboard.writeText(text);
      setFeedback("开发日志已复制。", "ok");
    } catch (err) {
      els.devLogOutput.focus();
      els.devLogOutput.select();
      document.execCommand("copy");
      setFeedback("开发日志已复制。", "ok");
    }
  }

  function clearDevLogs() {
    state.dev.logs = [];
    renderDevLogs();
    addDevLog("system", { message: "日志已清空" });
  }

  async function loadData() {
    showLoading(true);
    clearError();

    try {
      const [
        chinaProvinces,
        chinaCities,
        worldCountries,
        worldCities,
        worldCountryMeta,
        worldCountryMetrics,
      ] =
        await Promise.all([
          d3.json(`data/china-provinces.geojson?v=${encodeURIComponent(APP_VERSION)}`),
          d3.json(`data/china-cities.json?v=${encodeURIComponent(APP_VERSION)}`),
          d3.json(`data/world-countries.geojson?v=${encodeURIComponent(APP_VERSION)}`),
          d3.json(`data/world-cities.json?v=${encodeURIComponent(APP_VERSION)}`),
          d3.json(`data/world-countries-full.json?v=${encodeURIComponent(APP_VERSION)}`),
          d3.json(`data/world-country-metrics.json?v=${encodeURIComponent(APP_VERSION)}`),
        ]);

      state.data.chinaProvinces = normalizeGeoJsonOrientation(chinaProvinces);
      state.data.worldCountries = sanitizeWorldCountries(
        normalizeGeoJsonOrientation(worldCountries)
      );
      state.data.chinaCities = sanitizeChinaCities(chinaCities || []);
      state.data.worldCities = sanitizeWorldCities(worldCities || []);
      state.data.countryLabels = buildCountryLabels(worldCountryMeta || []);
      applyCountryMetrics(worldCountryMetrics || {});
      state.data.worldCityValidation = validateWorldCityCoordinates(
        state.data.worldCities,
        state.data.worldCountries,
        worldCountryMeta || []
      );
      reportWorldCityValidation(state.data.worldCityValidation);
      state.dataReady = true;

      showLoading(false);
      setModeButtonsDisabled(false);
      showHome();
    } catch (err) {
      console.error(err);
      showLoading(false);
      showError("数据加载失败，请检查 data 目录文件是否完整。");
    }
  }

  function sanitizeChinaCities(list) {
    return (Array.isArray(list) ? list : [])
      .filter((item) => isValidCoord(item.lat) && isValidCoord(item.lon))
      .filter((item) => item && (item.name || item.enName))
      .map((item) => ({
        name: item.name || item.enName,
        enName: item.enName || "",
        lat: Number(item.lat),
        lon: Number(item.lon),
        type: (item.type || "capital").toLowerCase(),
        province: item.province || "",
        country: "China",
      }));
  }

  function isExcludedChinaProvinceChallengeCity(city) {
    const province = city && (city.province || city.name || "");
    return CITY_CHALLENGE_EXCLUDED_PROVINCES.has(province);
  }

  function getChinaCityFamiliarity(name, cityType) {
    const key = normalizeCityName(name || "");
    const fame =
      key && Number.isFinite(CITY_FAME_SCORE_MAP[key]) ? Number(CITY_FAME_SCORE_MAP[key]) : null;

    if (cityType === "secondary") {
      if (fame != null) {
        return clamp01(fame * 0.72);
      }
      return 0.34;
    }

    if (fame != null) {
      return clamp01(0.42 + fame * 0.5);
    }
    return 0.68;
  }

  function buildChinaCapitalQuestions() {
    return state.data.chinaCities
      .filter((c) => c.type === "capital")
      .filter((c) => !isExcludedChinaProvinceChallengeCity(c))
      .map((city) => {
        const provinceName = city.province || city.name;
        const capitalName = CHINA_PROVINCE_CAPITAL_CITY_MAP[provinceName] || city.name;
        return {
          type: "city",
          name: city.name,
          prompt: `${provinceName}${capitalName}`,
          actualPosition: { lat: city.lat, lon: city.lon },
          cityType: "capital",
          country: "China",
          province: provinceName,
          familiarityScore: getChinaCityFamiliarity(city.name, "capital"),
        };
      });
  }

  function buildChinaSecondaryQuestions() {
    return CHINA_SECONDARY_CITIES
      .filter((city) => !CITY_CHALLENGE_EXCLUDED_PROVINCES.has(city.province))
      .map((city) => ({
        type: "city",
        name: city.name,
        prompt: `${city.province}第二大城市（${city.name}）`,
        actualPosition: { lat: city.lat, lon: city.lon },
        cityType: "secondary",
        country: "China",
        province: city.province,
        familiarityScore: getChinaCityFamiliarity(city.name, "secondary"),
      }));
  }

  function buildWorldCountryQuestions() {
    const features = Array.isArray(state.data.worldCountries.features)
      ? [...state.data.worldCountries.features]
      : [];
    const level = state.settings.worldCountryDifficulty || "all";
    const areaSorted = [...features].sort((a, b) => d3.geoArea(b) - d3.geoArea(a));
    const areaScoreMap = new Map();
    const denom = Math.max(1, areaSorted.length - 1);
    areaSorted.forEach((feature, idx) => {
      areaScoreMap.set(
        normalizeCountryName(Utils.getFeatureName(feature)),
        (areaSorted.length - 1 - idx) / denom
      );
    });

    const scored = features
      .filter((feature) => feature && Utils.getFeatureName(feature))
      .map((feature) => {
        const name = Utils.getFeatureName(feature);
        const metrics = getCountryMetrics(name);
        const hasGDP = Number.isFinite(Number(metrics && metrics.gdp && metrics.gdp.value));
        const gdpAreaScore = Number(
          metrics && metrics.scores && Number.isFinite(Number(metrics.scores.combined))
            ? metrics.scores.combined
            : areaScoreMap.get(normalizeCountryName(name)) || 0
        );
        return { feature, gdpAreaScore, hasGDP };
      })
      .sort((a, b) => b.gdpAreaScore - a.gdpAreaScore);

    let used = scored;
    if (level === "top50") {
      const withGDP = scored.filter((item) => item.hasGDP);
      const base = withGDP.slice(0, 50);
      if (base.length < 50) {
        const rest = scored.filter((item) => !base.includes(item));
        used = base.concat(rest.slice(0, 50 - base.length));
      } else {
        used = base;
      }
    }

    return used
      .filter((item) => item && item.feature && Utils.getFeatureName(item.feature))
      .map((item) => {
        const feature = item.feature;
        const center = getFeatureCenter(feature);
        const country = getBilingualCountryLabel(Utils.getFeatureName(feature));
        return {
          type: "province",
          name: Utils.getFeatureName(feature),
          prompt: `${country.zh} / ${country.en}`,
          actualPosition: center,
          familiarityScore: clamp01(item.gdpAreaScore),
        };
      });
  }

  function buildWorldCityQuestions() {
    const all = Array.isArray(state.data.worldCities) ? [...state.data.worldCities] : [];
    const level = state.settings.worldCityDifficulty || "top200";
    const cap = level === "top50" ? 50 : 200;
    const scored = all
      .map((city) => {
        const metrics = getCountryMetrics(city.country || "");
        const gdpScore = Number(
          metrics && metrics.scores && Number.isFinite(Number(metrics.scores.gdp))
            ? metrics.scores.gdp
            : metrics && metrics.scores && Number.isFinite(Number(metrics.scores.combined))
              ? metrics.scores.combined
              : 0.24
        );
        const typeScore = city.type === "major" ? 0.92 : 0.72;
        const fameScore = getCityFameScore(city);
        const region = (metrics && metrics.region) || "Other";
        const score =
          WORLD_CITY_SCORE_WEIGHTS.countryGDP * gdpScore +
          WORLD_CITY_SCORE_WEIGHTS.cityFame * fameScore +
          WORLD_CITY_SCORE_WEIGHTS.cityType * typeScore;
        return {
          city,
          region,
          fameScore,
          gdpScore,
          gdpValue: Number(metrics && metrics.gdp && metrics.gdp.value) || 0,
          areaValue: Number(metrics && metrics.area && metrics.area.value) || 0,
          hasMetrics: !!metrics,
          score,
        };
      })
      .sort((a, b) => b.score - a.score);
    const scoreByCityKey = new Map(
      scored.map((item) => [
        `${normalizeCityName(item.city && item.city.name)}|${normalizeCountryName(
          item.city && item.city.country
        )}`,
        Number(item.score) || 0,
      ])
    );

    const strictCandidates = scored.filter((item) => isWorldCityCandidate(item, level, false));
    let selected = selectWorldCitiesWithRegionBalance(strictCandidates, level, cap);

    // If strict filtering is too tight, softly relax while still avoiding tiny/obscure cities.
    if (selected.length < Math.min(cap, scored.length)) {
      const target = Math.min(cap, scored.length);
      const picked = new Set(
        selected.map(
          (city) => `${normalizeCityName(city.name)}|${normalizeCountryName(city.country)}`
        )
      );
      const relaxed = scored.filter((item) => isWorldCityCandidate(item, level, true));
      for (let i = 0; i < relaxed.length && selected.length < target; i += 1) {
        const city = relaxed[i].city || {};
        const key = `${normalizeCityName(city.name)}|${normalizeCountryName(city.country)}`;
        if (!picked.has(key)) {
          picked.add(key);
          selected.push(city);
        }
      }
    }

    return selected.map((city) => {
      const country = getBilingualCountryLabel(city.country || "");
      const cityDisplay =
        city.enName && city.enName !== city.name ? `${city.name} / ${city.enName}` : city.name;
      const label =
        city.type === "capital"
          ? `${country.zh} / ${country.en} 首都（${cityDisplay}）`
          : `${country.zh} / ${country.en} 主要城市（${cityDisplay}）`;
      return {
        type: "city",
        name: city.name,
        prompt: label,
        actualPosition: { lat: city.lat, lon: city.lon },
        cityType: city.type,
        country: city.country,
        familiarityScore: clamp01(
          scoreByCityKey.get(
            `${normalizeCityName(city.name)}|${normalizeCountryName(city.country)}`
          ) || 0
        ),
      };
    });
  }

  function isWorldCityCandidate(item, level, relaxed) {
    const entry = item || {};
    const city = entry.city || {};
    const fame = Number(entry.fameScore || 0);
    const gdp = Number(entry.gdpValue || 0);
    const area = Number(entry.areaValue || 0);
    const hasMetrics = !!entry.hasMetrics;
    const countryNorm = normalizeCountryName(city.country || "");
    const type = String(city.type || "capital").toLowerCase();

    if (WORLD_CITY_COUNTRY_BLOCKLIST.has(countryNorm)) {
      return false;
    }

    // Very strict for Top50, softer for Top200.
    if (level === "top50") {
      if (!hasMetrics) {
        return fame >= (relaxed ? 0.86 : 0.92);
      }
      if (!relaxed && type !== "major" && fame < 0.9) {
        return false;
      }
      if (gdp < 5e10 && fame < (relaxed ? 0.9 : 0.94)) {
        return false;
      }
      if (gdp < 1.2e11 && area < 2.2e4 && fame < (relaxed ? 0.86 : 0.9)) {
        return false;
      }
      if (area < 1500 && fame < (relaxed ? 0.9 : 0.95)) {
        return false;
      }
      return true;
    }

    if (!hasMetrics) {
      return fame >= (relaxed ? 0.74 : 0.82);
    }
    if (gdp < 2e10 && area < 1e4 && fame < (relaxed ? 0.75 : 0.82)) {
      return false;
    }
    if (area < 800 && fame < (relaxed ? 0.8 : 0.88)) {
      return false;
    }
    return true;
  }

  function getCityFameScore(city) {
    const key = normalizeCityName(city && (city.enName || city.name || ""));
    if (key && Number.isFinite(CITY_FAME_SCORE_MAP[key])) {
      return Number(CITY_FAME_SCORE_MAP[key]);
    }
    return city && city.type === "major" ? 0.78 : 0.62;
  }

  function selectWorldCitiesWithRegionBalance(scoredCities, level, cap) {
    const rows = Array.isArray(scoredCities) ? scoredCities : [];
    const target = Math.min(cap, rows.length);
    const quotas = WORLD_CITY_REGION_MINIMUMS[level] || WORLD_CITY_REGION_MINIMUMS.top200;

    const groups = new Map();
    rows.forEach((item) => {
      const region = String(item.region || "Other");
      if (!groups.has(region)) {
        groups.set(region, []);
      }
      groups.get(region).push(item);
    });
    groups.forEach((list) => list.sort((a, b) => b.score - a.score));

    const selected = [];
    const pickedKeys = new Set();

    const pick = (item) => {
      const city = item.city || {};
      const key = `${normalizeCityName(city.name)}|${normalizeCountryName(city.country)}`;
      if (!key || pickedKeys.has(key)) {
        return;
      }
      pickedKeys.add(key);
      selected.push(city);
    };

    Object.keys(quotas).forEach((region) => {
      const list = groups.get(region) || [];
      const need = Math.min(Number(quotas[region]) || 0, list.length);
      for (let i = 0; i < need; i += 1) {
        pick(list[i]);
      }
    });

    const fallback = rows.filter((item) => {
      const city = item.city || {};
      const key = `${normalizeCityName(city.name)}|${normalizeCountryName(city.country)}`;
      return !pickedKeys.has(key);
    });

    for (let i = 0; i < fallback.length && selected.length < target; i += 1) {
      pick(fallback[i]);
    }

    return selected.slice(0, target);
  }

  function sanitizeWorldCountries(geojson) {
    if (!geojson || !Array.isArray(geojson.features)) {
      return geojson;
    }

    const features = geojson.features.filter((feature) => {
      const normName = normalizeCountryName(Utils.getFeatureName(feature));
      if (!normName || isTaiwanName(normName)) {
        return false;
      }
      let area = 0;
      try {
        area = d3.geoArea(feature);
      } catch (err) {
        return false;
      }
      return Number.isFinite(area) && area >= WORLD_COUNTRY_MIN_AREA;
    });

    return { ...geojson, features };
  }

  function buildCountryLabels(list) {
    const map = new Map();
    const zhNames =
      typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function"
        ? new Intl.DisplayNames(["zh-CN"], { type: "region" })
        : null;
    const entries = Array.isArray(list) ? list : [];

    entries.forEach((item) => {
      const name = item && item.name ? item.name : {};
      const common = String(name.common || "").trim();
      const official = String(name.official || "").trim();
      const cca2 = String(item && item.cca2 ? item.cca2 : "").trim().toUpperCase();

      if (!common || !cca2) {
        return;
      }

      const zh = (zhNames && zhNames.of(cca2)) || common;
      const label = { en: common, zh };
      map.set(normalizeCountryName(common), label);
      if (official) {
        map.set(normalizeCountryName(official), label);
      }
    });

    return map;
  }

  function normalizeCountryName(value) {
    return String(value == null ? "" : value)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "");
  }

  function normalizeCityName(value) {
    return String(value == null ? "" : value)
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "");
  }

  function applyCountryMetrics(raw) {
    const byName = new Map();
    const byIso3 = new Map();
    const nameToIso3 = new Map();

    const countries = Array.isArray(raw.countries) ? raw.countries : [];
    countries.forEach((item) => {
      const name = item && item.name ? String(item.name) : "";
      const key = normalizeCountryName(name);
      if (key) {
        byName.set(key, item);
      }
    });

    const isoMetrics = raw.iso3Metrics && typeof raw.iso3Metrics === "object" ? raw.iso3Metrics : {};
    Object.keys(isoMetrics).forEach((iso3) => {
      const key = String(iso3 || "").toUpperCase();
      if (key) {
        byIso3.set(key, isoMetrics[iso3]);
      }
    });

    const aliasObj =
      raw.nameToIso3 && typeof raw.nameToIso3 === "object" ? raw.nameToIso3 : {};
    Object.keys(aliasObj).forEach((nameKey) => {
      const key = normalizeCountryName(nameKey);
      const iso3 = String(aliasObj[nameKey] || "").toUpperCase();
      if (key && iso3) {
        nameToIso3.set(key, iso3);
      }
    });

    state.data.countryMetricsByName = byName;
    state.data.countryIso3Metrics = byIso3;
    state.data.countryNameToIso3 = nameToIso3;
  }

  function getCountryMetrics(name) {
    const key = normalizeCountryName(name);
    if (!key) {
      return null;
    }

    const candidates = new Set([key]);
    if (COUNTRY_NAME_ALIASES[key]) {
      candidates.add(COUNTRY_NAME_ALIASES[key]);
    }
    Object.keys(COUNTRY_NAME_ALIASES).forEach((from) => {
      if (COUNTRY_NAME_ALIASES[from] === key) {
        candidates.add(from);
      }
    });

    for (const candidate of candidates) {
      if (state.data.countryMetricsByName.has(candidate)) {
        return state.data.countryMetricsByName.get(candidate);
      }
    }

    for (const candidate of candidates) {
      const iso3 = state.data.countryNameToIso3.get(candidate);
      if (iso3 && state.data.countryIso3Metrics.has(iso3)) {
        return state.data.countryIso3Metrics.get(iso3);
      }
    }

    return null;
  }

  function getCountryAliasCandidates(name) {
    const key = normalizeCountryName(name);
    if (!key) {
      return [];
    }
    const out = new Set([key]);
    if (COUNTRY_NAME_ALIASES[key]) {
      out.add(COUNTRY_NAME_ALIASES[key]);
    }
    Object.keys(COUNTRY_NAME_ALIASES).forEach((from) => {
      if (COUNTRY_NAME_ALIASES[from] === key) {
        out.add(from);
      }
    });
    return [...out];
  }

  function resolveWorldCountryFeature(countryName, worldGeoJson) {
    const features =
      worldGeoJson && Array.isArray(worldGeoJson.features) ? worldGeoJson.features : [];
    if (!features.length) {
      return null;
    }

    const candidates = new Set(getCountryAliasCandidates(countryName));
    for (let i = 0; i < features.length; i += 1) {
      const feature = features[i];
      const name = normalizeCountryName(Utils.getFeatureName(feature));
      if (candidates.has(name)) {
        return feature;
      }
    }
    return null;
  }

  function buildCountryCenterMap(list) {
    const map = new Map();
    const entries = Array.isArray(list) ? list : [];
    entries.forEach((item) => {
      const name = item && item.name ? item.name : {};
      const common = String(name.common || "").trim();
      const official = String(name.official || "").trim();
      const latlng = item && Array.isArray(item.latlng) ? item.latlng : [];
      if (!common || latlng.length < 2) {
        return;
      }

      const lat = Number(latlng[0]);
      const lon = Number(latlng[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return;
      }
      const center = { lat, lon };

      const commonKey = normalizeCountryName(common);
      if (commonKey) {
        map.set(commonKey, center);
      }
      const officialKey = normalizeCountryName(official);
      if (officialKey) {
        map.set(officialKey, center);
      }
    });
    return map;
  }

  function getCountryCenter(countryName, centerMap) {
    const map = centerMap instanceof Map ? centerMap : new Map();
    const candidates = getCountryAliasCandidates(countryName);
    for (let i = 0; i < candidates.length; i += 1) {
      const center = map.get(candidates[i]);
      if (center) {
        return center;
      }
    }
    return null;
  }

  function validateWorldCityCoordinates(worldCities, worldGeoJson, worldCountryMeta) {
    const cities = Array.isArray(worldCities) ? worldCities : [];
    const centerMap = buildCountryCenterMap(worldCountryMeta);
    const critical = [];
    const warnings = [];
    let checkedCapitals = 0;

    cities.forEach((city) => {
      if (!city || String(city.type || "").toLowerCase() !== "capital") {
        return;
      }
      checkedCapitals += 1;

      const feature = resolveWorldCountryFeature(city.country, worldGeoJson);
      if (!feature) {
        warnings.push({
          reason: "country_feature_missing",
          city: city.name,
          country: city.country,
        });
        return;
      }

      let inside = true;
      try {
        inside = d3.geoContains(feature, [Number(city.lon), Number(city.lat)]);
      } catch (err) {
        inside = false;
      }
      if (!inside) {
        critical.push({
          reason: "capital_outside_country",
          city: city.name,
          country: city.country,
          lat: city.lat,
          lon: city.lon,
        });
      }

      const center = getCountryCenter(city.country, centerMap);
      const metrics = getCountryMetrics(city.country);
      const area = Number(metrics && metrics.area && metrics.area.value) || 0;
      if (center && area > 500000) {
        const distToCenter = Utils.haversineDistance(
          { lat: Number(city.lat), lon: Number(city.lon) },
          center
        );
        // Large-country capital exactly at country-center is suspicious in this dataset.
        if (Number.isFinite(distToCenter) && distToCenter < 25) {
          warnings.push({
            reason: "capital_near_country_center_large_country",
            city: city.name,
            country: city.country,
            distanceKm: Number(distToCenter.toFixed(2)),
            lat: city.lat,
            lon: city.lon,
          });
        }
      }
    });

    return {
      checkedCapitals,
      critical,
      warnings,
    };
  }

  function reportWorldCityValidation(report) {
    if (!report) {
      return;
    }
    const criticalCount = Array.isArray(report.critical) ? report.critical.length : 0;
    const warningCount = Array.isArray(report.warnings) ? report.warnings.length : 0;
    if (!criticalCount && !warningCount) {
      return;
    }

    const summary = {
      checkedCapitals: report.checkedCapitals || 0,
      criticalCount,
      warningCount,
      critical: (report.critical || []).slice(0, 10),
      warnings: (report.warnings || []).slice(0, 10),
    };

    console.warn("[data-quality] world city validation issues:", summary);
    addDevLog("world_city_validation", summary);
  }

  function getBilingualCountryLabel(name) {
    const enName = String(name == null ? "" : name).trim();
    if (!enName) {
      return { en: "", zh: "" };
    }

    const labels = state.data.countryLabels;
    const norm = normalizeCountryName(enName);
    const direct = labels.get(norm);
    if (direct) {
      return { en: direct.en || enName, zh: direct.zh || enName };
    }

    const alias = COUNTRY_NAME_ALIASES[norm];
    if (alias && labels.has(alias)) {
      const item = labels.get(alias);
      return { en: item.en || enName, zh: item.zh || enName };
    }

    return { en: enName, zh: enName };
  }

  function isTaiwanName(normName) {
    return (
      normName === "taiwan" ||
      normName === "taiwanprovinceofchina" ||
      normName === "taiwan,provinceofchina" ||
      normName === "taiwan*"
    );
  }

  function normalizeGeoJsonOrientation(geojson) {
    if (!geojson || !Array.isArray(geojson.features)) {
      return geojson;
    }
    const threshold = 2 * Math.PI;
    const features = geojson.features.map((feature) => {
      if (!feature || !feature.geometry) {
        return feature;
      }

      let area = 0;
      try {
        area = d3.geoArea(feature);
      } catch (err) {
        return feature;
      }

      if (!(area > threshold)) {
        return feature;
      }
      return reverseFeatureRings(feature);
    });

    return { ...geojson, features };
  }

  function reverseFeatureRings(feature) {
    const geometry = feature.geometry || {};
    const type = geometry.type;
    let coordinates = geometry.coordinates;

    if (type === "Polygon" && Array.isArray(coordinates)) {
      coordinates = coordinates.map((ring) =>
        Array.isArray(ring) ? [...ring].reverse() : ring
      );
    } else if (type === "MultiPolygon" && Array.isArray(coordinates)) {
      coordinates = coordinates.map((polygon) =>
        Array.isArray(polygon)
          ? polygon.map((ring) => (Array.isArray(ring) ? [...ring].reverse() : ring))
          : polygon
      );
    } else {
      return feature;
    }

    return {
      ...feature,
      geometry: {
        ...geometry,
        coordinates,
      },
    };
  }

  function sanitizeWorldCities(list) {
    return (Array.isArray(list) ? list : [])
      .filter((item) => item && isValidCoord(item.lat) && isValidCoord(item.lon))
      .map((item) => ({
        name: item.name || item.enName || item.country || "未知城市",
        enName: item.enName || "",
        lat: Number(item.lat),
        lon: Number(item.lon),
        type: (item.type || "capital").toLowerCase(),
        province: item.province || "",
        country: item.country || "Unknown",
      }))
      .filter((item) => !isTaiwanName(normalizeCountryName(item.country)))
      .filter((item) => item.type === "capital" || item.type === "major");
  }

  function isValidCoord(value) {
    return Number.isFinite(Number(value));
  }

  function clamp01(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return 0;
    }
    return Math.max(0, Math.min(1, n));
  }

  function setModeButtonsDisabled(flag) {
    els.modeButtons.forEach((btn) => {
      btn.disabled = !!flag;
    });
  }

  function showLoading(flag) {
    els.loadingText.classList.toggle("hidden", !flag);
  }

  function showError(message) {
    els.errorText.textContent = message;
    els.errorText.classList.remove("hidden");
  }

  function clearError() {
    els.errorText.textContent = "";
    els.errorText.classList.add("hidden");
  }

  function showPage(pageId) {
    [els.homePage, els.gamePage, els.resultPage].forEach((page) => {
      page.classList.add("hidden");
    });
    document.getElementById(pageId).classList.remove("hidden");
  }

  function showHome() {
    clearAutoNextTimer();
    setFeedback("");
    clearError();
    renderRecords();
    showPage("home-page");
  }

  function startGame(mode) {
    if (!state.dataReady || !MODE_CONFIG[mode]) {
      return;
    }

    state.mode = mode;
    state.currentQuestion = 0;
    state.totalQuestions = TOTAL_QUESTIONS;
    state.score = 0;
    state.accuracy = 0;
    state.totalDistance = 0;
    state.currentTarget = null;
    state.questions = generateQuestions(mode, TOTAL_QUESTIONS);
    state.totalQuestions = state.questions.length;
    state.history = [];
    state.awaitingAnswer = false;
    clearAutoNextTimer();

    if (!state.questions.length) {
      showError("题库数据不足，无法开始该模式。");
      return;
    }

    showPage("game-page");
    setAssistToolsVisible(state.settings.showAssistTools, false);
    els.modeTitle.textContent = MODE_CONFIG[mode].title;
    addDevLog("game_start", {
      mode,
      title: MODE_CONFIG[mode].title,
      totalQuestions: state.totalQuestions,
      provinceDifficulty: state.settings.provinceDifficulty,
      cityDifficulty: state.settings.cityDifficulty,
      worldCountryDifficulty: state.settings.worldCountryDifficulty,
      worldCityDifficulty: state.settings.worldCityDifficulty,
    });
    renderGameMap();
    renderQuestion();
  }

  function generateQuestions(mode, count) {
    const size = Number.isFinite(count) ? count : TOTAL_QUESTIONS;

    if (mode === "province-click") {
      const items = (state.data.chinaProvinces.features || [])
        .filter((f) => f && Utils.getFeatureName(f))
        .filter(
          (f) => Utils.normalizeName(Utils.getFeatureName(f)) !== Utils.normalizeName("澳门特别行政区")
        )
        .map((feature) => {
          const center = getFeatureCenter(feature);
          return {
            type: "province",
            name: Utils.getFeatureName(feature),
            prompt: Utils.getFeatureName(feature),
            actualPosition: center,
          };
        });
      return sampleQuestionsWithRecency(mode, items, size);
    }

    if (mode === "city-click") {
      const cityLevel = state.settings.cityDifficulty || "easy";
      const capitalItems = buildChinaCapitalQuestions();
      const secondaryItems = cityLevel === "super" ? buildChinaSecondaryQuestions() : [];
      const items = [...capitalItems, ...secondaryItems];
      return sampleQuestionsProgressiveWithRecency(mode, items, size);
    }

    if (mode === "world-province") {
      const items = buildWorldCountryQuestions();
      return sampleQuestionsProgressiveWithRecency(mode, items, size);
    }

    if (mode === "world-city") {
      const items = buildWorldCityQuestions();
      return sampleQuestionsProgressiveWithRecency(mode, items, size);
    }

    return [];
  }

  function getQuestionRecencyKey(mode, item) {
    const entry = item || {};
    const name = Utils.normalizeName(entry.name || "");
    const prompt = Utils.normalizeName(entry.prompt || "");
    const province = Utils.normalizeName(entry.province || "");
    const country = Utils.normalizeName(entry.country || "");
    return [mode, entry.type || "", name, prompt, province, country].join("|");
  }

  function sampleQuestionsWithRecency(mode, items, count) {
    const list = Array.isArray(items) ? items : [];
    const targetSize = Math.min(Number.isFinite(count) ? Number(count) : TOTAL_QUESTIONS, list.length);
    if (!targetSize) {
      return [];
    }

    const { recent, fresh, stale } = splitRecencyPool(mode, list);
    let picked = [];

    if (fresh.length >= targetSize) {
      picked = Utils.sampleSize(fresh, targetSize);
    } else {
      picked = Utils.sampleSize(fresh, fresh.length);
      const need = targetSize - picked.length;
      picked = picked.concat(Utils.sampleSize(stale, need));
    }

    picked = Utils.sampleSize(picked, picked.length);

    rememberRecentQuestions(mode, recent, picked, targetSize);
    return picked;
  }

  function sampleQuestionsProgressiveWithRecency(mode, items, count) {
    const list = Array.isArray(items) ? items : [];
    const targetSize = Math.min(Number.isFinite(count) ? Number(count) : TOTAL_QUESTIONS, list.length);
    if (!targetSize) {
      return [];
    }

    const { recent, fresh, stale } = splitRecencyPool(mode, list);
    const pool = [...Utils.sampleSize(fresh, fresh.length), ...Utils.sampleSize(stale, stale.length)];

    const scored = pool
      .map((item) => ({
        item,
        familiarity: clamp01(getQuestionFamiliarity(mode, item)),
      }))
      .sort((a, b) => b.familiarity - a.familiarity);

    const remaining = [...scored];
    const picked = [];

    for (let i = 0; i < targetSize && remaining.length; i += 1) {
      const ratio = targetSize <= 1 ? 0 : i / (targetSize - 1);
      const targetIndex = Math.round(ratio * (remaining.length - 1));
      const jitter = Math.max(1, Math.floor(remaining.length * 0.12));
      const minIndex = Math.max(0, targetIndex - jitter);
      const maxIndex = Math.min(remaining.length - 1, targetIndex + jitter);
      const pickIndex =
        minIndex + Math.floor(Math.random() * (maxIndex - minIndex + 1));
      const pickedItem = remaining.splice(pickIndex, 1)[0];
      picked.push(pickedItem.item);
    }

    rememberRecentQuestions(mode, recent, picked, targetSize);
    return picked;
  }

  function splitRecencyPool(mode, list) {
    const recent = Array.isArray(state.recentQuestionKeysByMode[mode])
      ? state.recentQuestionKeysByMode[mode]
      : [];
    const recentSet = new Set(recent);
    const fresh = list.filter((item) => !recentSet.has(getQuestionRecencyKey(mode, item)));
    const stale = list.filter((item) => recentSet.has(getQuestionRecencyKey(mode, item)));
    return { recent, fresh, stale };
  }

  function rememberRecentQuestions(mode, recent, picked, targetSize) {
    const recentLimit = Math.max(targetSize * 6, 80);
    const appended = picked.map((item) => getQuestionRecencyKey(mode, item));
    state.recentQuestionKeysByMode[mode] = [...recent, ...appended].slice(-recentLimit);
  }

  function getQuestionFamiliarity(mode, item) {
    const entry = item || {};
    if (Number.isFinite(Number(entry.familiarityScore))) {
      return Number(entry.familiarityScore);
    }

    if (mode === "city-click") {
      return getChinaCityFamiliarity(entry.name || entry.prompt || "", entry.cityType || "capital");
    }

    if (mode === "world-city") {
      return getCityFameScore(entry);
    }

    return 0.5;
  }

  function getFeatureCenter(feature) {
    const props = feature && feature.properties ? feature.properties : {};
    if (Array.isArray(props.center) && props.center.length >= 2) {
      return { lon: Number(props.center[0]), lat: Number(props.center[1]) };
    }
    const centroid = d3.geoCentroid(feature);
    return { lon: centroid[0], lat: centroid[1] };
  }

  function getMapRenderPreset(scope, isReview) {
    const world = scope === "world";
    const maxScale = isReview ? (world ? 10 : 8) : world ? 28 : 16;
    return {
      projection: world ? "naturalEarth1" : "equirectangular",
      mapThemeClass: world ? "map-theme-world" : "map-theme-china",
      padding: isReview ? (world ? 10 : 8) : world ? 12 : 10,
      scaleExtent: [1, maxScale],
      fitBounds: world ? null : [[73.5, 18], [135.1, 53.6]],
    };
  }

  function getChinaOutlineFeature() {
    const world = state.data.worldCountries;
    if (!world || !Array.isArray(world.features)) {
      return null;
    }
    return (
      world.features.find(
        (feature) =>
          Utils.normalizeName(Utils.getFeatureName(feature)) === Utils.normalizeName("China")
      ) || null
    );
  }

  function getChinaSupplementFeatures(chinaOutline) {
    const provinces = state.data.chinaProvinces;
    const features = provinces && Array.isArray(provinces.features) ? provinces.features : [];
    if (!features.length) {
      return [];
    }

    const supplements = [];

    const taiwan = features.find(
      (feature) =>
        Utils.normalizeName(Utils.getFeatureName(feature)) === Utils.normalizeName("台湾省")
    );
    if (taiwan) {
      let includeTaiwan = true;
      if (chinaOutline) {
        try {
          const c = getFeatureCenter(taiwan);
          includeTaiwan = !d3.geoContains(chinaOutline, [Number(c.lon), Number(c.lat)]);
        } catch (err) {
          includeTaiwan = true;
        }
      }
      if (includeTaiwan) {
        supplements.push(taiwan);
      }
    }

    features.forEach((feature) => {
      const props = feature && feature.properties ? feature.properties : {};
      const adchar = String(props.adchar || "").toUpperCase();
      const adcode = String(props.adcode || "");
      if (adchar === "JD" || adcode.endsWith("_JD")) {
        supplements.push(feature);
      }
    });

    return supplements;
  }

  function buildChinaBasemapFeature(chinaOutline) {
    const supplements = getChinaSupplementFeatures(chinaOutline);
    if (!chinaOutline) {
      if (!supplements.length) {
        return state.data.chinaProvinces || null;
      }
      return {
        type: "FeatureCollection",
        features: supplements,
      };
    }

    if (!supplements.length) {
      return chinaOutline;
    }

    return {
      type: "FeatureCollection",
      features: [chinaOutline, ...supplements],
    };
  }

  function renderGameMap() {
    const scope = MODE_CONFIG[state.mode].scope;
    const preset = getMapRenderPreset(scope, false);
    const chinaOutline = scope === "china" ? getChinaOutlineFeature() : null;
    const chinaBasemap = scope === "china" ? buildChinaBasemapFeature(chinaOutline) : null;
    const featureClasses = [];
    const cityHardMode =
      state.mode === "city-click" &&
      (state.settings.cityDifficulty === "hard" || state.settings.cityDifficulty === "super");

    if (state.mode === "province-click") {
      featureClasses.push("map-feature-no-border");
      if (state.settings.provinceDifficulty === "hard") {
        featureClasses.push("map-feature-hard");
      }
    }
    if (cityHardMode) {
      featureClasses.push("map-feature-no-border", "map-feature-hard");
    }
    state.activeGeoJson =
      scope === "china" ? state.data.chinaProvinces : state.data.worldCountries;

    state.mapContext = Utils.renderMap(state.activeGeoJson, els.mapContainer, {
      zoomable: true,
      scaleExtent: preset.scaleExtent,
      padding: preset.padding,
      projection: preset.projection,
      basemapFeature: chinaBasemap || state.activeGeoJson,
      basemapClass: preset.mapThemeClass,
      outlineClass: preset.mapThemeClass,
      outlineFeature: chinaBasemap || state.activeGeoJson,
      featureClass: featureClasses.join(" "),
      fitBounds: preset.fitBounds,
      disableDoubleClickZoom: true,
      ariaLabel: "game-map",
    });

    // Make hard city mode deterministic: no province borders and no hover highlight.
    if (cityHardMode) {
      state.mapContext.features.classed("map-feature-no-border", true).classed("map-feature-hard", true);
    }

    state.viewScaleIndex = 0;
    syncMapScaleButton();
    state.touchPointers.clear();
    state.touchGestureDetected = false;
    state.downTransform = null;
    state.downPoint = null;

    state.mapContext.svg
      .on("pointerdown.answer", onMapPointerDown)
      .on("pointerup.answer", onMapPointerUp)
      .on("pointercancel.answer", onMapPointerCancel);
  }

  function onMapPointerDown(event) {
    if (event && event.pointerType === "touch" && Number.isFinite(event.pointerId)) {
      if (event.isPrimary) {
        resetTouchTracking();
      }
      state.touchPointers.add(event.pointerId);
      if (state.touchPointers.size > 1) {
        state.touchGestureDetected = true;
      }
      if (!event.isPrimary) {
        return;
      }
    }

    state.downPoint = Utils.getPointerPosition(event, state.mapContext.svg.node());
    state.downTransform = captureMapTransform();
  }

  function onMapPointerCancel(event) {
    if (event && event.pointerType === "touch" && Number.isFinite(event.pointerId)) {
      if (event.isPrimary) {
        resetTouchTracking();
      } else {
        state.touchPointers.delete(event.pointerId);
        if (!state.touchPointers.size) {
          state.touchGestureDetected = false;
        }
      }
    }
    state.downPoint = null;
    state.downTransform = null;
  }

  function resetTouchTracking() {
    state.touchPointers.clear();
    state.touchGestureDetected = false;
  }

  function captureMapTransform() {
    const transform =
      state.mapContext && typeof state.mapContext.getTransform === "function"
        ? state.mapContext.getTransform()
        : null;
    return {
      x: Number(transform && transform.x) || 0,
      y: Number(transform && transform.y) || 0,
      k: Number(transform && transform.k) || 1,
    };
  }

  function hasMapTransformChanged(prev, next) {
    if (!prev || !next) {
      return false;
    }
    const dx = Math.abs(Number(next.x || 0) - Number(prev.x || 0));
    const dy = Math.abs(Number(next.y || 0) - Number(prev.y || 0));
    const dk = Math.abs(Number(next.k || 1) - Number(prev.k || 1));
    return dx > 2 || dy > 2 || dk > 0.002;
  }

  function onMapPointerUp(event) {
    if (!state.awaitingAnswer || !state.currentTarget || !state.mapContext) {
      return;
    }
    const pointerType = event && event.pointerType ? event.pointerType : "mouse";
    if (pointerType === "touch" && event && event.isPrimary === false) {
      if (Number.isFinite(event.pointerId)) {
        state.touchPointers.delete(event.pointerId);
      }
      if (!state.touchPointers.size) {
        state.touchGestureDetected = false;
      }
      return;
    }

    const upPoint = Utils.getPointerPosition(event, state.mapContext.svg.node());
    const downPoint = state.downPoint || upPoint;
    const downTransform = state.downTransform;
    state.downPoint = null;
    state.downTransform = null;

    const currentTransform = captureMapTransform();
    const transformChanged = hasMapTransformChanged(downTransform, currentTransform);

    let touchGesture = state.touchGestureDetected;
    if (event && event.pointerType === "touch" && Number.isFinite(event.pointerId)) {
      touchGesture = touchGesture || state.touchPointers.size > 1;
      state.touchPointers.delete(event.pointerId);
      if (!state.touchPointers.size) {
        state.touchGestureDetected = false;
      }
    }

    if (touchGesture || transformChanged) {
      setFeedback("检测到缩放或拖动，请轻点地图作答。", "warn");
      addDevLog("gesture_skip", {
        pointerType,
        touchGesture,
        transformChanged,
      });
      return;
    }

    const moved = Math.hypot(upPoint.x - downPoint.x, upPoint.y - downPoint.y);
    const movementThreshold = pointerType === "touch" ? 18 : 8;
    if (moved > movementThreshold) {
      setFeedback("检测到拖动，请轻点地图作答。", "warn");
      addDevLog("drag_skip", {
        pointerType,
        movedPx: Number(moved.toFixed(2)),
      });
      return;
    }

    const modeType = MODE_CONFIG[state.mode].type;
    const geo = Utils.screenToGeo(
      upPoint.x,
      upPoint.y,
      state.mapContext.projection,
      state.mapContext.getTransform()
    );

    if (modeType === "province") {
      const activeFeatures =
        state.activeGeoJson && Array.isArray(state.activeGeoJson.features)
          ? state.activeGeoJson.features
          : [];
      const feature =
        getFeatureFromEvent(event) ||
        (geo ? Utils.findFeatureByPoint(geo.lon, geo.lat, activeFeatures) : null);
      if (!feature) {
        setFeedback("请点击地图轮廓内区域。", "warn");
        addDevLog("province_click_invalid", { clickGeo: geo, clickScreen: upPoint });
        return;
      }
      handleProvinceAnswer({
        geo,
        feature,
        screenPoint: upPoint,
      });
    } else {
      if (!geo) {
        setFeedback("请点击地图有效区域。", "warn");
        addDevLog("city_click_invalid", { screenPoint: upPoint });
        return;
      }

      const activeFeatures =
        state.activeGeoJson && Array.isArray(state.activeGeoJson.features)
          ? state.activeGeoJson.features
          : [];
      const feature =
        getFeatureFromEvent(event) || Utils.findFeatureByPoint(geo.lon, geo.lat, activeFeatures);
      if (!feature) {
        setFeedback("请点击地图轮廓内区域。", "warn");
        addDevLog("city_click_outside_map", { clickGeo: geo, clickScreen: upPoint });
        return;
      }
      handleCityAnswer(geo);
    }
  }

  function getFeatureFromEvent(event) {
    const rawTarget = event && event.target;
    if (!rawTarget || typeof rawTarget.closest !== "function") {
      return null;
    }
    const pathEl = rawTarget.closest("path.map-feature");
    if (!pathEl) {
      return null;
    }
    return d3.select(pathEl).datum() || null;
  }

  function handleProvinceAnswer(input) {
    const payload = input || {};
    const geo = payload.geo || null;
    const feature = payload.feature || null;
    const screenPoint = payload.screenPoint || null;
    const target = state.currentTarget;
    const clickedName = feature ? Utils.getFeatureName(feature) : null;
    const correct =
      !!clickedName &&
      Utils.normalizeName(clickedName) === Utils.normalizeName(target.name);

    if (correct) {
      state.score += 1;
    }

    state.history.push({
      question: target.name,
      actualPosition: target.actualPosition,
      playerPosition: geo,
      distance: 0,
      clickedName: clickedName || "未命中区域",
      isCorrect: correct,
    });

    addDevLog("province_click", {
      question: target.name,
      clickedName: clickedName || null,
      isCorrect: correct,
      clickGeo: geo,
      clickScreen: screenPoint,
    });
    highlightProvinceResult(target.name, clickedName, correct);

    if (correct) {
      setFeedback("回答正确。", "ok");
      finalizeQuestion({ autoNextMs: AUTO_NEXT_DELAY_MS });
    } else if (clickedName) {
      const clickedDisplay = formatProvinceFeedbackName(clickedName);
      const targetDisplay = formatProvinceFeedbackName(target.name);
      setFeedback(`未命中，点击了：${clickedDisplay}。正确答案：${targetDisplay}。`, "error");
      finalizeQuestion({ autoNextMs: AUTO_NEXT_DELAY_MS });
    } else {
      const targetDisplay = formatProvinceFeedbackName(target.name);
      setFeedback(`未命中有效行政区。正确答案：${targetDisplay}。`, "error");
      finalizeQuestion({ autoNextMs: AUTO_NEXT_DELAY_MS });
    }
  }

  function formatProvinceFeedbackName(name) {
    const raw = String(name == null ? "" : name).trim();
    if (!raw) {
      return "";
    }
    if (state.mode === "world-province") {
      const label = getBilingualCountryLabel(raw);
      return `${label.zh} / ${label.en}`;
    }
    return raw;
  }

  function highlightProvinceResult(targetName, clickedName, correct) {
    const norm = Utils.normalizeName;

    state.mapContext.features
      .classed("feature-target", (d) => norm(Utils.getFeatureName(d)) === norm(targetName))
      .classed(
        "feature-selected",
        (d) => !!clickedName && norm(Utils.getFeatureName(d)) === norm(clickedName)
      )
      .classed(
        "feature-correct",
        (d) => correct && norm(Utils.getFeatureName(d)) === norm(targetName)
      )
      .classed(
        "feature-wrong",
        (d) =>
          !correct &&
          !!clickedName &&
          norm(Utils.getFeatureName(d)) === norm(clickedName)
      );
  }

  function handleCityAnswer(geo) {
    const target = state.currentTarget;
    const distance = Utils.haversineDistance(geo, target.actualPosition);

    if (!Number.isFinite(distance)) {
      setFeedback("坐标计算失败，请重试。", "warn");
      return;
    }

    state.totalDistance += distance;
    if (distance <= 300) {
      state.score += 1;
    }

    state.history.push({
      question: target.prompt,
      actualPosition: target.actualPosition,
      playerPosition: geo,
      distance,
      clickedName: null,
      isCorrect: distance <= 300,
    });

    state.mapContext.clearOverlays();
    state.mapContext.drawLine(geo, target.actualPosition, "distance-line");
    state.mapContext.drawMarker({
      lat: target.actualPosition.lat,
      lon: target.actualPosition.lon,
      className: "target-marker",
      radius: 6,
    });
    state.mapContext.drawMarker({
      lat: geo.lat,
      lon: geo.lon,
      className: "player-marker",
      radius: 5,
    });

    addDevLog("city_click", {
      question: target.prompt,
      targetGeo: target.actualPosition,
      clickGeo: geo,
      distanceKm: Number(distance.toFixed(3)),
      isCorrect: distance <= 300,
    });

    if (distance <= 300) {
      setFeedback(`误差：${Utils.formatDistance(distance)}`, "ok");
      finalizeQuestion({ autoNextMs: AUTO_NEXT_DELAY_MS });
    } else {
      setFeedback(
        `误差：${Utils.formatDistance(distance)}。正确位置：${target.prompt}。`,
        "warn"
      );
      finalizeQuestion({ autoNextMs: AUTO_NEXT_DELAY_MS });
    }
  }

  function finalizeQuestion(options) {
    const opts = options || {};
    const autoNextMs = Number.isFinite(opts.autoNextMs) ? Number(opts.autoNextMs) : 0;
    clearAutoNextTimer();
    state.awaitingAnswer = false;
    updateLiveScore();

    const isLast = state.currentQuestion >= state.totalQuestions - 1;
    els.nextBtn.disabled = false;
    els.nextBtn.textContent = isLast ? "查看结果" : "下一题";

    if (autoNextMs > 0) {
      els.nextBtn.disabled = true;
      els.nextBtn.textContent = isLast ? "2秒后查看结果" : "2秒后自动下一题";
      state.autoNextTimer = window.setTimeout(() => {
        state.autoNextTimer = null;
        handleNext();
      }, autoNextMs);
    }
  }

  function renderQuestion() {
    state.currentTarget = state.questions[state.currentQuestion];
    state.awaitingAnswer = true;

    state.mapContext.clearOverlays();
    clearFeatureHighlightState();

    const q = state.currentTarget;
    const modeType = MODE_CONFIG[state.mode].type;

    if (modeType === "province") {
      els.question.textContent = `请点击：${q.prompt}`;
    } else {
      els.question.textContent = `请定位：${q.prompt}`;
    }

    els.progress.textContent = `${state.currentQuestion + 1}/${state.totalQuestions}`;
    els.nextBtn.disabled = true;
    els.nextBtn.textContent = "下一题";
    setFeedback("");
    updateLiveScore();

    addDevLog("question", {
      mode: state.mode,
      order: state.currentQuestion + 1,
      total: state.totalQuestions,
      prompt: q.prompt,
      answer: q.name,
    });
  }

  function updateLiveScore() {
    if (MODE_CONFIG[state.mode].type === "province") {
      els.liveScore.textContent = `正确：${state.score}`;
    } else {
      els.liveScore.textContent = `总误差：${Utils.formatDistance(state.totalDistance)}`;
    }
  }

  function clearFeatureHighlightState() {
    if (!state.mapContext || !state.mapContext.features) {
      return;
    }
    state.mapContext.features
      .classed("feature-target", false)
      .classed("feature-selected", false)
      .classed("feature-correct", false)
      .classed("feature-wrong", false);
  }

  function handleNext() {
    clearAutoNextTimer();
    if (state.awaitingAnswer) {
      return;
    }

    if (state.currentQuestion >= state.totalQuestions - 1) {
      finishGame();
      return;
    }

    state.currentQuestion += 1;
    renderQuestion();
  }

  function finishGame() {
    clearAutoNextTimer();
    if (MODE_CONFIG[state.mode].type === "province") {
      const correct = state.history.filter((h) => h.isCorrect).length;
      state.accuracy = correct / state.totalQuestions;
      els.scoreText.textContent = getProvinceScore(state.accuracy);

      els.details.innerHTML = [
        `<p>模式：${escapeHtml(MODE_CONFIG[state.mode].title)}</p>`,
        `<p>准确率：${(state.accuracy * 100).toFixed(0)}%</p>`,
        `<p>正确题数：${correct}/${state.totalQuestions}</p>`,
      ].join("");
    } else {
      const avg = state.totalDistance / state.totalQuestions;
      els.scoreText.textContent = getCityScore(state.totalDistance);

      els.details.innerHTML = [
        `<p>模式：${escapeHtml(MODE_CONFIG[state.mode].title)}</p>`,
        `<p>总误差：${Utils.formatDistance(state.totalDistance)}</p>`,
        `<p>平均误差：${Utils.formatDistance(avg)}</p>`,
        `<p>300km 内命中：${state.score}/${state.totalQuestions}</p>`,
      ].join("");
    }

    showPage("result-page");
    updateBestRecord();
    renderReviewMap();
    renderHistoryList();
  }

  function loadRecords() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.records);
      const parsed = raw ? JSON.parse(raw) : {};
      state.records = parsed && typeof parsed === "object" ? parsed : {};
    } catch (err) {
      state.records = {};
    }
  }

  function saveRecords() {
    try {
      window.localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(state.records));
    } catch (err) {
      // ignore storage errors
    }
  }

  function formatRecordLine(mode, entry) {
    if (!entry) {
      return `${MODE_CONFIG[mode].title}：暂无`;
    }
    if (MODE_CONFIG[mode].type === "province") {
      return `${MODE_CONFIG[mode].title}：${entry.correct}/${entry.total}（${entry.accuracy}%）`;
    }
    return `${MODE_CONFIG[mode].title}：总误差 ${entry.totalDistance}`;
  }

  function renderRecords() {
    if (!els.recordsContent) {
      return;
    }
    const modes = ["province-click", "city-click", "world-province", "world-city"];
    const lines = modes.map((mode) => {
      const text = formatRecordLine(mode, state.records[mode]);
      return `<div class="record-line">${escapeHtml(text)}</div>`;
    });
    els.recordsContent.innerHTML = lines.join("");
  }

  function updateBestRecord() {
    const mode = state.mode;
    if (!MODE_CONFIG[mode]) {
      return;
    }

    if (MODE_CONFIG[mode].type === "province") {
      const correct = state.history.filter((h) => h.isCorrect).length;
      const accuracy = Number(((correct / state.totalQuestions) * 100).toFixed(0));
      const current = state.records[mode];
      const isBetter =
        !current ||
        correct > Number(current.correct || 0) ||
        (correct === Number(current.correct || 0) && accuracy > Number(current.accuracy || 0));
      if (isBetter) {
        state.records[mode] = {
          correct,
          total: state.totalQuestions,
          accuracy,
          updatedAt: new Date().toISOString(),
        };
        saveRecords();
      }
      return;
    }

    const totalDistance = Number(state.totalDistance.toFixed(2));
    const current = state.records[mode];
    const isBetter = !current || totalDistance < Number(current.distanceRaw || Infinity);
    if (isBetter) {
      state.records[mode] = {
        totalDistance: Utils.formatDistance(totalDistance),
        distanceRaw: totalDistance,
        updatedAt: new Date().toISOString(),
      };
      saveRecords();
    }
  }

  function getCurrentDifficultyLabel() {
    if (state.mode === "province-click") {
      return state.settings.provinceDifficulty === "hard" ? "困难" : "简单";
    }
    if (state.mode === "city-click") {
      if (state.settings.cityDifficulty === "super") return "超级";
      return state.settings.cityDifficulty === "hard" ? "困难" : "简单";
    }
    if (state.mode === "world-province") {
      return state.settings.worldCountryDifficulty === "top50" ? "Top 50" : "全部国家";
    }
    if (state.mode === "world-city") {
      return state.settings.worldCityDifficulty === "top50" ? "Top 50" : "Top 200";
    }
    return "默认";
  }

  function buildSharePayload() {
    const modeTitle = MODE_CONFIG[state.mode].title;
    const difficulty = getCurrentDifficultyLabel();
    let scoreLine = "";

    if (MODE_CONFIG[state.mode].type === "province") {
      const correct = state.history.filter((h) => h.isCorrect).length;
      scoreLine = `成绩 ${correct}/${state.totalQuestions}`;
    } else {
      scoreLine = `总误差 ${Utils.formatDistance(state.totalDistance)}`;
    }

    const url = `${window.location.origin}${window.location.pathname}?mode=${encodeURIComponent(
      state.mode
    )}&v=${encodeURIComponent(APP_VERSION)}`;
    const text = `我在《地理知识问答》${modeTitle}（${difficulty}）打出 ${scoreLine}，你敢来挑战吗？`;
    return {
      title: "地理知识问答挑战",
      text,
      url,
    };
  }

  async function shareResult() {
    if (!state.mode) {
      return;
    }
    const payload = buildSharePayload();

    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch (err) {
        // fallback to clipboard
      }
    }

    const copyText = `${payload.text}\n${payload.url}`;
    try {
      await navigator.clipboard.writeText(copyText);
      window.alert("分享文案和链接已复制，快发给朋友挑战吧。");
    } catch (err) {
      window.alert(`${payload.text}\n${payload.url}`);
    }
  }

  function clearAutoNextTimer() {
    if (state.autoNextTimer) {
      window.clearTimeout(state.autoNextTimer);
      state.autoNextTimer = null;
    }
  }

  function renderReviewMap() {
    const scope = MODE_CONFIG[state.mode].scope;
    const preset = getMapRenderPreset(scope, true);
    const chinaOutline = scope === "china" ? getChinaOutlineFeature() : null;
    const chinaBasemap = scope === "china" ? buildChinaBasemapFeature(chinaOutline) : null;
    const geojson =
      scope === "china" ? state.data.chinaProvinces : state.data.worldCountries;

    state.reviewMapContext = Utils.renderMap(geojson, els.mapReview, {
      zoomable: true,
      scaleExtent: preset.scaleExtent,
      padding: preset.padding,
      projection: preset.projection,
      basemapFeature: chinaBasemap || geojson,
      basemapClass: preset.mapThemeClass,
      outlineClass: preset.mapThemeClass,
      outlineFeature: chinaBasemap || geojson,
      fitBounds: preset.fitBounds,
      disableDoubleClickZoom: true,
      ariaLabel: "review-map",
    });

    if (MODE_CONFIG[state.mode].type === "province") {
      const resultMap = new Map();
      state.history.forEach((h) => {
        resultMap.set(Utils.normalizeName(h.question), !!h.isCorrect);
      });

      state.reviewMapContext.features
        .classed("feature-review-correct", (d) => {
          const name = Utils.normalizeName(Utils.getFeatureName(d));
          return resultMap.get(name) === true;
        })
        .classed("feature-review-wrong", (d) => {
          const name = Utils.normalizeName(Utils.getFeatureName(d));
          return resultMap.get(name) === false;
        });
    } else {
      state.history.forEach((h) => {
        state.reviewMapContext.drawLine(h.playerPosition, h.actualPosition, "distance-line");
        state.reviewMapContext.drawMarker({
          lat: h.actualPosition.lat,
          lon: h.actualPosition.lon,
          className: "target-marker",
          radius: 4,
        });
        state.reviewMapContext.drawMarker({
          lat: h.playerPosition.lat,
          lon: h.playerPosition.lon,
          className: "player-marker",
          radius: 3,
        });
      });
    }
  }

  function renderHistoryList() {
    if (MODE_CONFIG[state.mode].type === "province") {
      const rows = state.history
        .map((item, index) => {
          const result = item.isCorrect ? "正确" : "错误";
          return `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(item.question)}</td>
              <td>${escapeHtml(item.clickedName || "-")}</td>
              <td>${result}</td>
            </tr>
          `;
        })
        .join("");

      els.historyList.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>题目</th>
              <th>你的点击</th>
              <th>结果</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
      return;
    }

    const rows = state.history
      .map((item, index) => {
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.question)}</td>
            <td>${Utils.formatDistance(item.distance)}</td>
          </tr>
        `;
      })
      .join("");

    els.historyList.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>题目</th>
            <th>误差</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  function setFeedback(text, type) {
    els.feedback.textContent = text || "";
    els.feedback.classList.remove("feedback-ok", "feedback-warn", "feedback-error");
    if (!text) {
      return;
    }
    if (type === "ok") {
      els.feedback.classList.add("feedback-ok");
      return;
    }
    if (type === "warn") {
      els.feedback.classList.add("feedback-warn");
      return;
    }
    els.feedback.classList.add("feedback-error");
  }

  function getProvinceScore(accuracy) {
    if (accuracy >= 1.0) return "料事如神";
    if (accuracy >= 0.8) return "深不可测";
    if (accuracy >= 0.6) return "出类拔萃";
    if (accuracy >= 0.4) return "马马虎虎";
    return "还得再练练";
  }

  function getCityScore(totalDistance) {
    if (totalDistance < 500) return "料事如神";
    if (totalDistance < 1000) return "深不可测";
    if (totalDistance < 2000) return "出类拔萃";
    if (totalDistance < 5000) return "马马虎虎";
    return "还得再练练";
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
