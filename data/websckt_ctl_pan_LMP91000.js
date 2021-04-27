// Javascript code to set up a websocket for the LMP91000 control panel.


var m_websocket;
var m_url_JS = "ws://nanostat.local:81/";
var button;
var canvas;
var context;
var maxDataPoints = 100;

// initialize plotly plot

// var trace_scope = {
//     x: [],
//     y: [],
//     mode: 'markers',
//     type: 'scatter'
// };
// var data_scope = [trace_scope];
// Plotly.newPlot('plotly-scope', data_scope);

var trace_scope_current = {
    x: [],
    y: [],
    mode: 'markers',
    type: 'scatter',
    name: "Current"
};
var trace_scope_voltage = {
    x: [],
    y: [],
    mode: 'markers',
    type: 'scatter',
    yaxis: 'y2',
    name: "Voltage"
};

var data_IVvsTime_scope = [trace_scope_current, trace_scope_voltage];
var m_2yaxis_layout = {
    margin: {
        l: 50,
        r: 5,
        b: 50,
        t: 1,
        pad: 4
    },
    xaxis: {
        title: { text: 'Time (ms)' }
    },
    yaxis: { title: 'Current (microA)' },
    yaxis2: {
        title: 'Voltage (mV)',
        titlefont: { color: 'rgb(148, 103, 189)' },
        tickfont: { color: 'rgb(148, 103, 189)' },
        overlaying: 'y',
        side: 'right'
    }
};

 Plotly.newPlot('plotly-scope-2yaxis', data_IVvsTime_scope, m_2yaxis_layout, { scrollZoom: true, editable: true, responsive: true });
// Plotly.newPlot('plotly-scope-2yaxis', data_IVvsTime_scope);





// This is called when the page finishes loading
function init() {

    // Assign page elements to variables
    button = document.getElementById("toggleButton");
    canvas = document.getElementById("led");

    // Draw circle in canvas
    // context = canvas.getContext("2d");
    // context.arc(25, 25, 15, 0, Math.PI * 2, false);
    // context.lineWidth = 3;
    // context.strokeStyle = "black";
    // context.stroke();
    // context.fillStyle = "black";
    // context.fill();

    wsConnect(m_url_JS);   // Connect to WebSocket server


}

// Call this to connect to the WebSocket server
function wsConnect(m_url_JS) {

    // Connect to WebSocket server
    m_url_JS = "ws://" + window.location.hostname + ":81/"
    m_websocket = new WebSocket(m_url_JS);

    // Assign callbacks
    m_websocket.onopen = function (evt) { onOpen(evt) };
    m_websocket.onclose = function (evt) { onClose(evt) };
    m_websocket.onmessage = function (evt) { onMessage(evt) };
    m_websocket.onerror = function (evt) { onError(evt) };

}

// Called when a WebSocket connection is established with the server
function onOpen(evt) {

    // Log connection state
    console.log("Connected");

    // initialize values to front panel browswer:
    doSend("{\"change_cell_voltage_to\":" + document.getElementById("cell_voltage_id").value + "}");
    doSend("{\"change_num_readings_to_average_per_point_to\":" + document.getElementById("num_readings_to_average_per_point_id").value + "}");
    doSend("{\"change_lmpGain_to\":" + document.getElementById("lmpGain_id").value + "}");
    doSend("{\"change_control_panel_is_active_to\":false}");
    doSend("{\"change_delay_between_points_ms_to\":" + document.getElementById("delay_between_points_ms_id").value + "}");

}

// Called when the WebSocket connection is closed
function onClose(evt) {

    // Log disconnection state
    console.log("Disconnected");



    // Try to reconnect after a few seconds
    setTimeout(function () { wsConnect(m_url_JS) }, 2000);
}



// Called when a message is received from the server
function onMessage(evt) {

    // Print out our received message
    // console.log("Received: " + evt.data);
    var m_json_obj = JSON.parse(evt.data);
    // console.log(m_json_obj);
    var m_voltage_point = m_json_obj.volts;
    var m_current_point = m_json_obj.amps;
    var m_time_point = m_json_obj.time;
    
    // if (trace_scope.x.length > maxDataPoints) {
    //     trace_scope.x.shift();
    //     trace_scope.y.shift();
    // }
    // trace_scope.x.push(m_time_point);
    // trace_scope.y.push(m_current_point);
   
    // var data_scope = [trace_scope];
    // Plotly.newPlot('plotly-scope', data_scope);


    // 2 y axis scope:
    if (trace_scope_current.x.length > maxDataPoints) {
        trace_scope_current.x.shift();
        trace_scope_current.y.shift();
        trace_scope_voltage.x.shift();
        trace_scope_voltage.y.shift();
    }
    trace_scope_current.x.push(m_time_point);
    trace_scope_current.y.push(m_current_point);
    trace_scope_voltage.x.push(m_time_point);
    trace_scope_voltage.y.push(m_voltage_point);
    // console.log(trace_scope_current);
    // console.log(trace_scope_voltage);

    var data_IVvsTime_scope = [trace_scope_current, trace_scope_voltage];


    
     Plotly.newPlot('plotly-scope-2yaxis', data_IVvsTime_scope, m_2yaxis_layout, { scrollZoom: true, editable: true, responsive: true });
    // Plotly.newPlot('plotly-scope-2yaxis', data_IVvsTime_scope);
    







}



// Called when a WebSocket error occurs
function onError(evt) {
    console.log("ERROR: " + evt.data);
}

// Sends a message to the server (and prints it to the console)
function doSend(message) {
    console.log("Sending: " + message);
    m_websocket.send(message);
}


// Called whenever the HTML button is pressed
function onPress() {
    doSend("Button pressed. Sending this message over websocket from html page to ESP32 websocket server....");
}
// Call the init function as soon as the page loads
window.addEventListener("load", init, false);

// Set listeners to send UI inputs to ESP32:
document.getElementById("cell_voltage_id").addEventListener("change", respond_to_cell_voltage_input_change);

function respond_to_cell_voltage_input_change() { // tell main.cpp to change cell voltage
    // console.log("cell voltage input changed to");
    // console.log(document.getElementById("cell_voltage_id").value);
    // send message via websockets to server
    var cell_voltage_JSON_command;
    cell_voltage_JSON_command = "{\"change_cell_voltage_to\":" + document.getElementById("cell_voltage_id").value + "}";
    // console.log("Prototype JSON string to send=");
    // console.log(cell_voltage_JSON_command); 
    doSend(cell_voltage_JSON_command);
}

document.getElementById("num_readings_to_average_per_point_id").addEventListener("change", respond_to_num_readings_to_average_per_point_change);

function respond_to_num_readings_to_average_per_point_change() { // tell main.cpp to change num readings per point
    var cell_voltage_JSON_command;
    cell_voltage_JSON_command = "{\"change_num_readings_to_average_per_point_to\":" + document.getElementById("num_readings_to_average_per_point_id").value + "}";
    doSend(cell_voltage_JSON_command);
}

document.getElementById("delay_between_points_ms_id").addEventListener("change", respond_to_delay_between_points_ms_change);

function respond_to_delay_between_points_ms_change() { // tell main.cpp to change num readings per point
    var cell_voltage_JSON_command;
    cell_voltage_JSON_command = "{\"change_delay_between_points_ms_to\":" + document.getElementById("delay_between_points_ms_id").value + "}";
    doSend(cell_voltage_JSON_command);
}

document.getElementById("lmpGain_id").addEventListener("change", respond_to_lmpGain_change);

function respond_to_lmpGain_change() { // tell main.cpp to change num readings per point
    var cell_voltage_JSON_command;
    cell_voltage_JSON_command = "{\"change_lmpGain_to\":" + document.getElementById("lmpGain_id").value + "}";
    doSend(cell_voltage_JSON_command);
}

document.getElementById("m_control_panel_is_active_id").addEventListener("change", respond_to_m_control_panel_is_active_id_change);

function respond_to_m_control_panel_is_active_id_change() {
    var control_panel_is_active_JSON_command;
    control_panel_is_active_JSON_command = "{\"change_control_panel_is_active_to\":true}";
    doSend(control_panel_is_active_JSON_command);
}


document.getElementById("m_control_panel_is_inactive_id").addEventListener("change", respond_to_m_control_panel_is_inactive_id_change);

function respond_to_m_control_panel_is_inactive_id_change() {
    var control_panel_is_active_JSON_command;
    control_panel_is_active_JSON_command = "{\"change_control_panel_is_active_to\":false}";
    doSend(control_panel_is_active_JSON_command);
}


document.getElementById("max_number_of_points_in_browser_id").addEventListener("change", respond_to_max_number_of_points_in_browser_id_change);

function respond_to_max_number_of_points_in_browser_id_change() {
    maxDataPoints = document.getElementById("max_number_of_points_in_browser_id").value;
    // console.log("*******************");
    // console.log(maxDataPoints);
    // console.log(trace_scope.x.length);
    // if (trace_scope.x.length > maxDataPoints) {
    //     var num_points_to_delete;
    //     num_points_to_delete = trace_scope.x.length - maxDataPoints;
    //     for (i = 0; i < num_points_to_delete; i++) {
    //         trace_scope.x.shift();
    //         trace_scope.y.shift();
    //         // console.log(i);
    //     }
    // }
    // // console.log(trace_scope.x.length);
    // console.log("*******************");



    if (trace_scope_current.x.length > maxDataPoints) {
        var num_points_to_delete;
        num_points_to_delete = trace_scope_current.x.length - maxDataPoints;
        for (i = 0; i < num_points_to_delete; i++) {
            trace_scope_current.x.shift();
            trace_scope_current.y.shift();
            trace_scope_voltage.x.shift();
            trace_scope_voltage.y.shift();
            // console.log(i);
        }
    }








}



function removeData() {
    dataPlot.data.labels.shift();
    dataPlot.data.datasets[0].data.shift();
}
function addData(label, data) {
    if (dataPlot.data.labels.length > maxDataPoints) removeData();
    dataPlot.data.labels.push(label);
    dataPlot.data.datasets[0].data.push(data);
    dataPlot.update();
}