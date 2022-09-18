namespace vnw_microbit{

    let recvString = '';
    let wifi_connected = false;

    let pauseBaseValue: number = 1000;
    let EventSource = 2836;
    enum EventValue {
        NONE,
        ConnectWifi,
        CIPSTART,
        CIPSEND,
        CIPSEND_DATA,
        CIPCLOSE,
        WAITOK

    }
    let currentEvent = EventValue.NONE;


    function sendAT(command: string, wait: number = 0) {
        serial.writeString(`${command}\u000D\u000A`)
        if(wait) basic.pause(wait)
    }

    function restEsp8266() {
        sendAT("AT+RESTORE", 1000) // restore to factory settings
        sendAT("AT+RST", 1000) // rest
        serial.readString()
        sendAT("AT+CWMODE=1", 500) // set to STA mode
        sendAT("AT+SYSTIMESTAMP=1634953609130", 100) // Set local timestamp.
        sendAT(`AT+CIPSNTPCFG=1,8,"ntp1.aliyun.com","0.pool.ntp.org","time.google.com"`, 100)
    }

    //% block="Připojit k wifi SSID = %ssid|KEY = %pw"
    //% ssid.defl=Název_sítě
    //% pw.defl=Heslo_sítě weight=95
    export function wiFiConnect(ssid: string, pw: string): void {

        control.runInParallel(function(){
            serial.redirect(
                SerialPin.P8,
                SerialPin.P12,
                BaudRate.BaudRate115200
            )
            basic.pause(100);

            serial.setTxBufferSize(128);
            serial.setRxBufferSize(128);  
            restEsp8266();

            currentEvent = EventValue.ConnectWifi
            sendAT(`AT+CWJAP="${ssid}","${pw}"`) // connect to Wifi router
            control.waitForEvent(EventSource, EventValue.ConnectWifi)
            while (!wifi_connected) {
                restEsp8266()
                sendAT(`AT+CWJAP="${ssid}","${pw}"`)
                control.waitForEvent(EventSource, EventValue.ConnectWifi)
            }
        })
    }

    //% block="Odešli uložená data data = %body"
    //% body.defl="Textová data"
    export function sendData(body: string) {

        sendTextData(body);
    }

    function sendTextData(body : string){

        control.runInParallel(function(){

            while (!wifi_connected) {
                control.waitForEvent(EventSource, EventValue.ConnectWifi)
            }

            //recvString = '';

            let myMethod = 'POST';
            let host = 'www.vnw.cz';
            let port = '80';
            let urlPath = '/microbit';
            
            let data: string = "AT+CIPSTART=\"TCP\",\"" + host + "\"," + port
            

            currentEvent = EventValue.CIPSTART
            sendAT(data);
            control.waitForEvent(EventSource, EventValue.CIPSTART)
            control.waitForEvent(EventSource, EventValue.WAITOK)

            //data = "GET /microbit"
        
            //sendAT("AT+CIPSEND=" + (data.length + 2), pauseBaseValue * 3)
            //sendAT(data, pauseBaseValue * 6)

            data = myMethod + " " + urlPath + " HTTP/1.1" + "\u000D" + "\u000A"
                + "Host: " + host + "\u000D" + "\u000A"
            /*
            if (headers && headers.length > 0) {
                data += headers + "\u000D" + "\u000A"
            }*/
            data += "Test: xxx\u000D" + "\u000A"
            data += "Test2: yyy\u000D" + "\u000A"
            data += "Content-length: " + body.length + "\u000D" + "\u000A"
            data += "\u000D" + "\u000A"
            data += body
            data += "\u000D" + "\u000A"
            // Send data:

            currentEvent = EventValue.CIPSEND
            sendAT("AT+CIPSEND=" + (data.length + 2))
            control.waitForEvent(EventSource, EventValue.CIPSEND)
            control.waitForEvent(EventSource, EventValue.WAITOK)


            currentEvent = EventValue.CIPSEND_DATA
            sendAT(data)
            control.waitForEvent(EventSource, EventValue.CIPSEND_DATA)
            control.waitForEvent(EventSource, EventValue.WAITOK)
            // Close TCP connection:
            sendAT("AT+CIPCLOSE")
            currentEvent = EventValue.NONE
        });
    }

    /**
     * Zobrazí háček
     */
    //% block
    export function zobrazHacek() : void{

        basic.showLeds(`
            . . . . #
            . . . . #
            # # . # .
            . # # # .
            . . # . .
            `);
    }

    serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
        recvString += serial.readString();
        //led.plot(0, 0);

        //basic.showString(recvString)

        if (currentEvent == EventValue.ConnectWifi) {

            if (recvString.includes("AT+CWJAP")) {
                recvString = recvString.slice(recvString.indexOf("AT+CWJAP"))
                if (recvString.includes("WIFI GOT IP")) {
                    wifi_connected = true
                    recvString = ""
                    control.raiseEvent(EventSource, EventValue.ConnectWifi)
                } else if (recvString.includes("ERROR")) {
                    wifi_connected = false
                    recvString = ""
                    control.raiseEvent(EventSource, EventValue.ConnectWifi)
                }
            }
        }

        if (currentEvent == EventValue.CIPSTART) {

            if (recvString.includes("AT+CIPSTART")) { // "CONNECT" ? Ne => Čekám na OK
                control.raiseEvent(EventSource, EventValue.CIPSTART)
            }
        }

        if (currentEvent == EventValue.CIPSEND) {

            if (recvString.includes("AT+CIPSEND")) { // "SEND OK" ? Ne => Čekám na OK
                control.raiseEvent(EventSource, EventValue.CIPSEND)
            }
        }

        if (currentEvent == EventValue.CIPSEND_DATA) {

            if (recvString.includes("+IPD")) { // "SEND OK" ?

                control.raiseEvent(EventSource, EventValue.CIPSEND)
                recvString = ""
            }
        }

        if (recvString.includes("\u000D" + "\u000A" + "OK" + "\u000D" + "\u000A")) {
            control.raiseEvent(EventSource, EventValue.WAITOK);
            recvString = "";
        }
    });

    //% block
    export function vratPrijatyString(): string {

        return recvString;
    }

    //% block
    export function isWifiConnect(): boolean {

        return wifi_connected;
    }
}
