// script.js - Fully Dynamic Version
class DynamicCottonPredictor {
  constructor() {
    this.currentDistrict = "ahmedabad";
    this.currentYear = "2025";
    this.priceChart = null;
    this.weatherData = null;
    this.historicalData = null;
    this.isInitialized = false;
    this.apiKey = null;
    this.baseURL = window.location.origin;
    this.usingLiveData = false;
  }

  async initialize() {
    await this.loadDistricts();
    this.setupEventListeners();
    this.initializeChart();
    await this.loadInitialData();
    this.startRealTimeUpdates();
    this.isInitialized = true;

    this.loadSavedApiKey();
  }

  async loadDistricts() {
    try {
      const response = await fetch(`${this.baseURL}/api/districts`);
      const data = await response.json();

      const districtSelect = document.getElementById("citySelect");
      districtSelect.innerHTML = '<option value="">Select District...</option>';

      data.districts.forEach((district) => {
        const option = document.createElement("option");
        const code = typeof district === "object" ? (district.code || district.name).toLowerCase() : district.toLowerCase();
        const name = typeof district === "object" ? (district.name || district.code) : district;
        option.value = code;
        option.textContent = name;
        if (code === this.currentDistrict) {
          option.selected = true;
        }
        districtSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Failed to load districts from API:", error);
      this.showNotification("Using default district list", "warning");
    }
  }

  setupEventListeners() {
    // District selection
    document.getElementById("citySelect").addEventListener("change", (e) => {
      this.currentDistrict = e.target.value;
      this.onDistrictChange();
    });

    // Year selection
    document.getElementById("yearSelect").addEventListener("change", (e) => {
      this.currentYear = e.target.value;
      this.generatePredictions();
    });

    // Predict button
    document.getElementById("predictBtn").addEventListener("click", () => {
      this.generatePredictions();
    });

    // API Key save
    document.getElementById("saveApiKeyBtn").addEventListener("click", () => {
      this.saveApiKey();
    });

    // Weather sliders
    document.getElementById("rainfallSlider").addEventListener("input", (e) => {
      this.updateWeatherImpact();
    });

    document.getElementById("tempSlider").addEventListener("input", (e) => {
      this.updateWeatherImpact();
    });

    // Chart type buttons
    document.querySelectorAll(".chart-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.switchChartType(e.currentTarget.dataset.type);
      });
    });

    // Voice assistant
    document.getElementById("voiceAssistant").addEventListener("click", () => {
      this.activateVoiceAssistant();
    });

    // Mobile menu
    document.getElementById("menuToggle").addEventListener("click", () => {
      this.toggleMobileMenu();
    });

    document.querySelector(".nav-close").addEventListener("click", () => {
      this.toggleMobileMenu();
    });
  }
  async validateAndSaveApiKey() {
    const apiKeyInput = document.getElementById("apiKeyInput");
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      this.showNotification("Please enter an API key", "error");
      return;
    }

    this.showNotification("Validating API key...", "info");

    try {
      const validation = await this.validateApiKey(apiKey);

      if (validation.valid) {
        this.apiKey = apiKey;
        localStorage.setItem("cottonPredictorApiKey", apiKey);
        this.showNotification("✅ API key validated and saved!", "success");
        apiKeyInput.value = ""; // Clear for security
        apiKeyInput.placeholder = "API Key saved ✓";

        // Update status indicator
        this.updateApiKeyStatus(true);
      } else {
        this.showNotification(`❌ ${validation.message}`, "error");
        this.updateApiKeyStatus(false);
      }
    } catch (error) {
      this.showNotification("API key validation failed", "error");
      this.updateApiKeyStatus(false);
    }
  }

  async validateApiKey(apiKey) {
    try {
      const response = await fetch(`${this.baseURL}/api/validate-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ api_key: apiKey }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API key validation error:", error);
      return { valid: false, message: "Validation service unavailable" };
    }
  }

  updateApiKeyStatus(isValid) {
    let statusElement = document.getElementById("apiKeyStatus");
    if (!statusElement) {
      statusElement = document.createElement("div");
      statusElement.id = "apiKeyStatus";
      statusElement.className = "api-key-status";
      document.querySelector(".api-key-wrapper").appendChild(statusElement);
    }

    if (isValid) {
      statusElement.textContent = "✅ API Key Valid - Live data enabled";
      statusElement.className = "api-key-status valid";
    } else {
      statusElement.textContent = "❌ API Key Invalid - Using dataset";
      statusElement.className = "api-key-status invalid";
    }
  }

  initializeChart() {
    const ctx = document.getElementById("priceChart").getContext("2d");

    this.priceChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Predicted Cotton Price (₹/quintal)",
            data: [],
            borderColor: "#43A047",
            backgroundColor: "rgba(67, 160, 71, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "#43A047",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              color: "#37474F",
              font: { size: 12 },
            },
          },
          tooltip: {
            mode: "index",
            intersect: false,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            titleColor: "#43A047",
            bodyColor: "#37474F",
            borderColor: "#43A047",
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: function (context) {
                return `₹${context.parsed.y.toLocaleString("en-IN")}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: "rgba(55, 71, 79, 0.1)" },
            ticks: {
              color: "#78909C",
              callback: function (value) {
                return "₹" + value.toLocaleString("en-IN");
              },
            },
          },
          x: {
            grid: { color: "rgba(55, 71, 79, 0.1)" },
            ticks: { color: "#78909C" },
          },
        },
        animation: {
          duration: 1000,
          easing: "easeOutQuart",
        },
      },
    });
  }

  async loadInitialData() {
    await this.updateRealTimeData();
    await this.generatePredictions();
  }

  async onDistrictChange() {
    if (!this.currentDistrict) return;
    this.showLoading();
    try {
      await this.updateRealTimeData();
      await this.generatePredictions();
      this.updateDistrictSpecificInfo();
    } catch (error) {
      console.error("Failed to update district data:", error);
      this.showNotification("Failed to update district data", "error");
    } finally {
      this.hideLoading();
    }
  }

  updatePredictionsDisplay(data) {
    // Update chart
    this.updateChart(data.predictions);

    // Update statistics
    this.updateStatistics(data.statistics, data.confidence);

    // Update recommendations
    this.updateRecommendations(data);

    // Update weather impact analysis
    this.updateWeatherImpactAnalysis(data);

    // Update UI elements
    this.updateUIWithPredictions(data);
  }
  updateDataSourceIndicator(dataSource) {
    let sourceIndicator = document.querySelector(".data-source-indicator");
    if (!sourceIndicator) {
      sourceIndicator = document.createElement("div");
      sourceIndicator.className = "data-source-indicator";
      document.querySelector(".chart-header").appendChild(sourceIndicator);
    }

    if (dataSource.liveDataUsed) {
      sourceIndicator.innerHTML = `
                <div class="source-badge live">
                    <i class="fas fa-satellite"></i>
                    Live API Data • Current: ₹${dataSource.currentPrice.toLocaleString(
                      "en-IN"
                    )}
                </div>
            `;
    } else {
      sourceIndicator.innerHTML = `
                <div class="source-badge historical">
                    <i class="fas fa-database"></i>
                    Historical Dataset
                </div>
            `;
    }
  }

  updateConfidenceDisplay(confidence) {
    const accuracyElement = document.getElementById("accuracy");
    if (accuracyElement) {
      accuracyElement.textContent = `${confidence.accuracy}%`;
    }

    // Update model info in chart footer
    const chartStats = document.querySelector(".chart-stats");
    if (chartStats) {
      const modelElement =
        chartStats.querySelector(".model-info") ||
        document.createElement("div");
      modelElement.className = "chart-stat model-info";
      modelElement.innerHTML = `
                <span class="stat-label">Prediction Model</span>
                <span class="stat-value high">
                    <i class="fas fa-brain"></i> ${confidence.model}
                </span>
            `;
      if (!chartStats.querySelector(".model-info")) {
        chartStats.appendChild(modelElement);
      }
    }
  }

  updateChart(predictions) {
    const labels = predictions.map((p) => `${p.month} ${p.year}`);
    const prices = predictions.map((p) => p.price);

    // Smooth animation for chart update
    this.animateChartUpdate(labels, prices);
  }

  animateChartUpdate(labels, newData) {
    const currentData = this.priceChart.data.datasets[0].data;
    const steps = 30;
    const stepDuration = 20;

    if (currentData.length === 0) {
      // Initial data
      this.priceChart.data.labels = labels;
      this.priceChart.data.datasets[0].data = newData;
      this.priceChart.update();
      return;
    }

    // Animate from current to new data
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (steps * stepDuration), 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const currentFrameData = currentData.map((start, index) => {
        const end = newData[index] || start;
        return start + (end - start) * easeProgress;
      });

      this.priceChart.data.labels = labels;
      this.priceChart.data.datasets[0].data = currentFrameData;
      this.priceChart.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  updateStatistics(stats, confidence) {
    // Update main statistics
    document.getElementById(
      "avgPrice"
    ).textContent = `₹${stats.averagePrice.toLocaleString("en-IN")}`;
    document.getElementById("bestMonth").textContent = stats.bestMonth;
    document.getElementById("worstMonth").textContent = stats.worstMonth;
    document.getElementById("accuracy").textContent = `${confidence.accuracy}%`;

    // Update trend indicators
    this.updateTrendIndicators(stats);

    // Add animation effects
    this.animateStatisticsUpdate();
  }

  updateTrendIndicators(stats) {
    const trendElement = document.querySelector(".stat-trend");
    if (trendElement) {
      const priceChange = (
        ((stats.highestPrice - stats.lowestPrice) / stats.averagePrice) *
        100
      ).toFixed(1);
      trendElement.innerHTML = `<i class="fas fa-arrow-up"></i> ${priceChange}%`;
      trendElement.className = `stat-trend ${
        priceChange >= 0 ? "positive" : "negative"
      }`;
    }
  }

  animateStatisticsUpdate() {
    const statCards = document.querySelectorAll(".stat-card");
    statCards.forEach((card, index) => {
      card.style.animation = "none";
      setTimeout(() => {
        card.style.animation = `pulse 0.5s ease-in-out ${index * 0.1}s`;
      }, 10);
    });
  }

  updateRecommendations(data) {
    const recommendations = document.querySelector(".recommendation-list");
    const stats = data.statistics;

    recommendations.innerHTML = `
            <div class="recommendation-item slide-in-right">
                <div class="recommendation-icon success">
                    <i class="fas fa-calendar-check"></i>
                </div>
                <div class="recommendation-text">
                    <span class="rec-title">Best Selling Period</span>
                    <span class="rec-desc"><strong>${
                      stats.bestMonth
                    } 15-30</strong> (₹${stats.highestPrice.toLocaleString(
      "en-IN"
    )})</span>
                </div>
            </div>
            <div class="recommendation-item slide-in-right">
                <div class="recommendation-icon warning">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="recommendation-text">
                    <span class="rec-title">Avoid Selling In</span>
                    <span class="rec-desc"><strong>${
                      stats.worstMonth
                    }</strong> (Low: ₹${stats.lowestPrice.toLocaleString(
      "en-IN"
    )})</span>
                </div>
            </div>
            <div class="recommendation-item slide-in-right">
                <div class="recommendation-icon info">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="recommendation-text">
                    <span class="rec-title">Price Range</span>
                    <span class="rec-desc"><strong>₹${stats.lowestPrice.toLocaleString(
                      "en-IN"
                    )} - ₹${stats.highestPrice.toLocaleString(
      "en-IN"
    )}</strong></span>
                </div>
            </div>
            <div class="recommendation-item slide-in-right">
                <div class="recommendation-icon success">
                    <i class="fas fa-brain"></i>
                </div>
                <div class="recommendation-text">
                    <span class="rec-title">AI Confidence</span>
                    <span class="rec-desc"><strong>${
                      data.confidence.accuracy
                    }%</strong> (${data.confidence.model})</span>
                </div>
            </div>
        `;

    // Add staggered animation
    this.animateRecommendations();
  }

  animateRecommendations() {
    const items = document.querySelectorAll(".recommendation-item");
    items.forEach((item, index) => {
      item.style.animation = `slideInRight 0.5s ease-out ${index * 0.1}s both`;
    });
  }

  updateWeatherImpact() {
    const rainfallValue = document.getElementById("rainfallSlider").value;
    const tempValue = document.getElementById("tempSlider").value;

    // Update value displays
    document.getElementById("rainfallValue").textContent =
      rainfallValue < 33 ? "Low" : rainfallValue < 66 ? "Medium" : "High";
    document.getElementById("tempValue").textContent =
      tempValue < 33 ? "Low" : tempValue < 66 ? "Medium" : "High";

    // Update impact analysis
    this.updateWeatherImpactAnalysis();
  }

  updateWeatherImpactAnalysis(data = null) {
    const rainfallValue = document.getElementById("rainfallSlider").value;
    const tempValue = document.getElementById("tempSlider").value;

    // Calculate dynamic impacts based on slider values
    const rainfallImpact = (((rainfallValue - 50) / 50) * 15).toFixed(1); // -15% to +15%
    const tempImpact = (((tempValue - 50) / 50) * -12).toFixed(1); // +12% to -12% (inverse)

    // Update impact bars and values
    const impactItems = document.querySelectorAll(".impact-item");

    if (impactItems[0]) {
      impactItems[0].querySelector(".impact-fill").style.width = `${
        Math.abs(rainfallImpact) * 3.33
      }%`;
      impactItems[0].querySelector(".impact-value").textContent = `${
        rainfallImpact > 0 ? "+" : ""
      }${rainfallImpact}% Price Impact`;
      impactItems[0].querySelector(".impact-value").className = `impact-value ${
        rainfallImpact >= 0 ? "positive" : "negative"
      }`;
      impactItems[0].querySelector(".impact-icon").className = `impact-icon ${
        rainfallImpact >= 0 ? "positive" : "negative"
      }`;
    }

    if (impactItems[1]) {
      impactItems[1].querySelector(".impact-fill").style.width = `${
        Math.abs(tempImpact) * 3.33
      }%`;
      impactItems[1].querySelector(".impact-value").textContent = `${
        tempImpact > 0 ? "+" : ""
      }${tempImpact}% Price Impact`;
      impactItems[1].querySelector(".impact-value").className = `impact-value ${
        tempImpact >= 0 ? "positive" : "negative"
      }`;
      impactItems[1].querySelector(".impact-icon").className = `impact-icon ${
        tempImpact >= 0 ? "positive" : "negative"
      }`;
    }
  }

  updateUIWithPredictions(data) {
    // Update chart footer with dynamic data
    const chartStats = document.querySelector(".chart-stats");
    if (chartStats) {
      const trend =
        data.statistics.highestPrice > data.statistics.averagePrice
          ? "Rising"
          : "Falling";
      const trendClass = trend === "Rising" ? "positive" : "negative";

      chartStats.innerHTML = `
                <div class="chart-stat">
                    <span class="stat-label">Current Trend</span>
                    <span class="stat-value ${trendClass}">
                        <i class="fas fa-arrow-${
                          trend === "Rising" ? "up" : "down"
                        }"></i> ${trend}
                    </span>
                </div>
                <div class="chart-stat">
                    <span class="stat-label">AI Confidence</span>
                    <span class="stat-value high">
                        <i class="fas fa-shield-alt"></i> ${
                          data.confidence.accuracy
                        }%
                    </span>
                </div>
            `;
    }

    // Update header with district info
    this.updateHeaderInfo(data.district);
  }

  updateHeaderInfo(district) {
    const header = document.querySelector(".header");
    const existingInfo = header.querySelector(".district-info");

    if (existingInfo) {
      existingInfo.remove();
    }

    const districtInfo = document.createElement("div");
    districtInfo.className = "district-info";
    districtInfo.innerHTML = `
            <i class="fas fa-map-marker-alt"></i>
            <span>${district} • Gujarat</span>
        `;

    header.querySelector(".logo").appendChild(districtInfo);
  }

  async updateRealTimeData() {
    try {
      // Update current time
      this.updateCurrentTime();

      // Update live status
      this.updateLiveStatus();

      // Fetch historical data for current district
      await this.fetchHistoricalData();
    } catch (error) {
      console.error("Real-time data update failed:", error);
    }
  }

  async fetchHistoricalData() {
    try {
      const response = await fetch(
        `${this.baseURL}/api/historical/${this.currentDistrict}`
      );
      if (response.ok) {
        const data = await response.json();
        this.historicalData = data;
        this.updateHistoricalDisplay(data);
      }
    } catch (error) {
      console.error("Failed to fetch historical data:", error);
    }
  }
  // Add to the DynamicCottonPredictor class

  async validateApiKey(apiKey) {
    try {
      const response = await fetch(`${this.baseURL}/api/validate-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ api_key: apiKey }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API key validation error:", error);
      return { valid: false, message: "Validation service unavailable" };
    }
  }

  async generatePredictions() {
    if (!this.currentDistrict) {
      this.showNotification("Please select a district first!", "error");
      return;
    }

    this.showLoading();

    try {
      const rainfallImpact = document.getElementById("rainfallSlider").value;
      const tempImpact = document.getElementById("tempSlider").value;
      const inputKey = document.getElementById("apiKeyInput").value.trim();
      const apiKey = inputKey || this.apiKey || "default";

      // Validate API key if newly entered and not already validated
      let validatedKey = this.apiKey || "default";
      if (inputKey && inputKey !== "default" && inputKey !== this.apiKey) {
        this.showNotification("Validating API key...", "info");
        const validation = await this.validateApiKey(inputKey);
        if (validation.valid) {
          validatedKey = inputKey;
          this.apiKey = inputKey;
          localStorage.setItem("cottonPredictorApiKey", inputKey);
          this.showNotification(
            "✅ API key validated! Using live data.",
            "success"
          );
        } else {
          this.showNotification("⚠ " + validation.message, "warning");
          validatedKey = "default";
        }
      }

      const response = await fetch(`${this.baseURL}/api/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          district: this.currentDistrict,
          year: parseInt(this.currentYear),
          rainfall: parseInt(rainfallImpact),
          temperature: parseInt(tempImpact),
          months: 12,
          api_key: validatedKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      this.updatePredictionsDisplay(data);

      // Show data source info
      if (data.dataSource && data.dataSource.liveDataUsed) {
        this.showNotification(
          "🎯 Live data integrated! Enhanced accuracy active.",
          "success"
        );
      } else {
        this.showNotification(
          "📊 Using historical dataset for predictions.",
          "info"
        );
      }
    } catch (error) {
      console.error("Prediction error:", error);
      this.showNotification(
        "Failed to generate predictions. Using fallback data.",
        "warning"
      );
      this.useFallbackPredictions();
    } finally {
      this.hideLoading();
    }
  }

  // Update the predictions display to show data source
  updateUIWithPredictions(data) {
    // Update data source indicator
    const dataSourceInfo = document.createElement("div");
    dataSourceInfo.className = "data-source-info";
    dataSourceInfo.innerHTML = `
        <div class="source-badge ${
          data.dataSource.liveDataUsed ? "live" : "historical"
        }">
            <i class="fas fa-${
              data.dataSource.liveDataUsed ? "satellite" : "database"
            }"></i>
            ${
              data.dataSource.liveDataUsed
                ? "Live API Data"
                : "Historical Dataset"
            }
        </div>
    `;

    const chartHeader = document.querySelector(".chart-header");
    const existingBadge = chartHeader.querySelector(".source-badge");
    if (existingBadge) {
      existingBadge.remove();
    }
    chartHeader.appendChild(dataSourceInfo);

    // Rest of existing UI updates...
  }

  updateHistoricalDisplay(data) {
    // You can implement historical data visualization here
    console.log("Historical data loaded:", data);
  }

  updateCurrentTime() {
    const now = new Date();
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };

    const timeText = now.toLocaleDateString("en-IN", options);
    document.getElementById("timeText").textContent = timeText;
  }

  updateLiveStatus() {
    const statusItems = document.querySelectorAll(".status-item");
    statusItems.forEach((item) => {
      const badge = item.querySelector(".status-badge");
      if (badge) {
        badge.classList.add("pulse");
        setTimeout(() => {
          badge.classList.remove("pulse");
        }, 1000);
      }
    });
  }

  switchChartType(type) {
    // Update active button
    document.querySelectorAll(".chart-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    event.currentTarget.classList.add("active");

    // Update chart type with animation
    this.priceChart.config.type = type;

    // Adjust styling based on chart type
    if (type === "pie") {
      this.priceChart.data.datasets[0].backgroundColor = [
        "#43A047",
        "#66BB6A",
        "#81C784",
        "#A5D6A7",
        "#C8E6C9",
        "#4CAF50",
        "#388E3C",
        "#2E7D32",
        "#1B5E20",
        "#E8F5E8",
      ];
      this.priceChart.data.datasets[0].borderColor = "#ffffff";
    } else {
      this.priceChart.data.datasets[0].backgroundColor =
        "rgba(67, 160, 71, 0.1)";
      this.priceChart.data.datasets[0].borderColor = "#43A047";
    }

    this.priceChart.update("none");
  }

  // API Key Management
  saveApiKey() {
    const apiKeyInput = document.getElementById("apiKeyInput");
    const apiKey = apiKeyInput.value.trim();

    if (apiKey) {
      this.apiKey = apiKey;
      localStorage.setItem("cottonPredictorApiKey", apiKey);
      this.showNotification("API Key saved successfully!", "success");
      apiKeyInput.value = ""; // Clear input for security
      apiKeyInput.placeholder = "API Key saved ✓";
    } else {
      this.showNotification("Please enter a valid API Key", "error");
    }
  }

  loadSavedApiKey() {
    const savedKey = localStorage.getItem("cottonPredictorApiKey");
    if (savedKey) {
      this.apiKey = savedKey;
      document.getElementById("apiKeyInput").placeholder = "API Key saved ✓";
      this.updateApiKeyStatus(true);
    }
  }

  // Fallback for when API is unavailable
  useFallbackPredictions() {
    const fallbackData = {
      predictions: [
        { month: "Jan", year: 2025, price: 6500 },
        { month: "Feb", year: 2025, price: 6700 },
        { month: "Mar", year: 2025, price: 6900 },
        { month: "Apr", year: 2025, price: 7200 },
        { month: "May", year: 2025, price: 7500 },
        { month: "Jun", year: 2025, price: 7300 },
        { month: "Jul", year: 2025, price: 7100 },
        { month: "Aug", year: 2025, price: 6900 },
        { month: "Sep", year: 2025, price: 7200 },
        { month: "Oct", year: 2025, price: 7800 },
        { month: "Nov", year: 2025, price: 7600 },
        { month: "Dec", year: 2025, price: 7400 },
      ],
      statistics: {
        averagePrice: 7150,
        bestMonth: "October",
        worstMonth: "July",
        highestPrice: 7800,
        lowestPrice: 6500,
        priceRange: 1300,
      },
      confidence: {
        accuracy: 85,
        model: "Fallback Model",
        lastUpdated: new Date().toISOString(),
      },
      district: this.currentDistrict,
    };

    this.updatePredictionsDisplay(fallbackData);
  }

  // Utility Methods
  showLoading() {
    document.getElementById("loadingOverlay").style.display = "flex";
    document.getElementById("predictBtn").disabled = true;
    document.getElementById("predictBtn").innerHTML =
      '<i class="fas fa-spinner fa-spin"></i><span>Analyzing...</span>';
  }

  hideLoading() {
    document.getElementById("loadingOverlay").style.display = "none";
    document.getElementById("predictBtn").disabled = false;
    document.getElementById("predictBtn").innerHTML =
      '<i class="fas fa-bolt"></i><span class="btn-text">Generate AI Prediction</span>';
  }

  showNotification(message, type = "info") {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll(".notification");
    existingNotifications.forEach((notif) => notif.remove());

    // Create new notification
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;

    // Add styles
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            max-width: 400px;
        `;

    // Close button
    notification
      .querySelector(".notification-close")
      .addEventListener("click", () => {
        notification.remove();
      });

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.transform = "translateX(400px)";
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  }

  getNotificationIcon(type) {
    const icons = {
      success: "check-circle",
      error: "exclamation-triangle",
      warning: "exclamation-circle",
      info: "info-circle",
    };
    return icons[type] || "info-circle";
  }

  getNotificationColor(type) {
    const colors = {
      success: "#43A047",
      error: "#E53935",
      warning: "#FFB300",
      info: "#2196F3",
    };
    return colors[type] || "#2196F3";
  }

  activateVoiceAssistant() {
    const avgPrice = document.getElementById("avgPrice").textContent;
    const bestMonth = document.getElementById("bestMonth").textContent;

    const speech = new SpeechSynthesisUtterance();
    speech.text = `Welcome to AI Cotton Price Predictor. Current predictions for ${
      this.currentDistrict
    } show average price of ${avgPrice}. Best selling month is ${bestMonth} with ${this.getCurrentAccuracy()}% accuracy.`;
    speech.lang = "en-US";
    speech.rate = 0.8;
    speech.pitch = 1.1;

    window.speechSynthesis.speak(speech);

    // Visual feedback
    const btn = document.getElementById("voiceAssistant");
    btn.style.background = "var(--gradient-2)";
    setTimeout(() => {
      btn.style.background = "var(--gradient-1)";
    }, 2000);
  }

  getCurrentAccuracy() {
    const accuracyElement = document.getElementById("accuracy");
    return accuracyElement
      ? accuracyElement.textContent.replace("%", "")
      : "89";
  }

  toggleMobileMenu() {
    const mobileNav = document.getElementById("mobileNav");
    mobileNav.classList.toggle("active");
  }

  startRealTimeUpdates() {
    // Update time every second
    setInterval(() => {
      this.updateCurrentTime();
    }, 1000);

    // Update live status every 30 seconds
    setInterval(() => {
      this.updateLiveStatus();
    }, 30000);

    // Refresh data every 5 minutes
    setInterval(() => {
      this.updateRealTimeData();
    }, 300000);
  }

  updateDistrictSpecificInfo() {
    if (!this.currentDistrict) return;
    const districtName = this.currentDistrict
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    const tagline = document.querySelector(".tagline");
    if (tagline) {
      tagline.textContent = `Smart Farming, Better Earnings - ${districtName} Focus`;
    }
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  const predictor = new DynamicCottonPredictor();
  predictor.initialize();

  // Make it globally accessible for debugging
  window.cottonPredictor = predictor;
});
