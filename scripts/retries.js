
function ConstantRetryPolicy (interval) {
  this.interval = interval;
}

ConstantRetryPolicy.prototype.getNextRetryTimeout = function (retryCount) {
  return this.interval;
};

function LinearRetryPolicy (increment) {
  this.increment = increment;
}

LinearRetryPolicy.prototype.getNextRetryTimeout = function (retryCount) {
  return this.increment * retryCount;
};

function LinearWithJitterRetryPolicy (increment, j_min, j_max) {
  this.increment = increment;
  this.j_min = j_min;
  this.j_max = j_max;
}

LinearWithJitterRetryPolicy.prototype.getNextRetryTimeout = function (retryCount) {
  var randomJitter = Math.floor(Math.random() * (this.j_max - this.j_min)) - ((this.j_max - this.j_min) / 2);
  return this.increment * retryCount + randomJitter;
};

function ExponentialBackoffWithJitterRetryPolicy (c, c_min, c_max, j_u, j_d,) {
  this.c = c;
  this.c_min = c_min;
  this.c_max = c_max;
  this.j_u = j_u;
  this.j_d = j_d;
}

ExponentialBackoffWithJitterRetryPolicy.prototype.getNextRetryTimeout = function (retryCount) {
  // F(x) = min(Cmin+ (2^(x-1)-1) * rand(C * (1 – Jd), C*(1-Ju)), Cmax)
  var minRandomFactor = this.c * (1 - this.j_d);
  var maxRandomFactor = this.c * (1 - this.j_u);
  var randomJitter = Math.random() * (maxRandomFactor - minRandomFactor);
  return Math.min(this.c_min + (Math.pow(retryCount, 2) - 1) * randomJitter, this.c_max);
};


function RetryAttempt (waitTime, actualTime) {
  this.waitTime = waitTime;
  this.actualTime = actualTime;
}


function generateIntervalsOverTime(policy, maxRetryTimeout) {
  var intervals = [ new RetryAttempt(0, 0) ];

  var totalTime = 0;
  var retryCount = 1;
  while (totalTime <= maxRetryTimeout) {
    var waitTime = policy.getNextRetryTimeout(retryCount);
    var actualTime = totalTime + waitTime;
    var retryAttempt = new RetryAttempt(waitTime, actualTime);
    intervals.push(retryAttempt);
    retryCount++;
    totalTime = actualTime;
  }

  return intervals;
}