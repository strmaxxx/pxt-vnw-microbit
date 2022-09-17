//% color=190 weight=100 icon="\uf1ec" block="VNW Data"
namespace vnw_microbit{

    let recvString = '';
    let currentCmd = '';
    let wifi_connected = false;

    let pauseBaseValue: number = 1000;
    let EventSource = 2836;
    enum EventValue {
        ConnectWifi
    }


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
        serial.redirect(
            SerialPin.P8,
            SerialPin.P12,
            BaudRate.BaudRate115200
        )
        basic.pause(100);

        serial.setTxBufferSize(128);
        serial.setRxBufferSize(128);  
        restEsp8266();

        //currentCmd = Cmd.ConnectWifi
        sendAT(`AT+CWJAP="${ssid}","${pw}"`) // connect to Wifi router
        control.waitForEvent(EventSource, EventValue.ConnectWifi)
        while (!wifi_connected) {
            restEsp8266()
            sendAT(`AT+CWJAP="${ssid}","${pw}"`)
            control.waitForEvent(EventSource, EventValue.ConnectWifi)
        }
    }

    //% block="Odešli uložená data"
    export function sendData() {

        sendTextData('test');
    }

    function sendTextData(body : string){

        let myMethod = 'POST';
        let host = 'data.vnw.cz';
        let port = '80';
        let urlPath = '/log';

        control.runInParallel(function(){

            let data: string = "AT+CIPSTART=\"TCP\",\"" + host + "\"," + port
            sendAT(data)
            data = myMethod + " " + urlPath + " HTTP/1.1" + "\u000D" + "\u000A"
                + "Host: " + host + "\u000D" + "\u000A"
            /*
            if (headers && headers.length > 0) {
                data += headers + "\u000D" + "\u000A"
            }*/
            if (data && data.length > 0) {
                data += "\u000D" + "\u000A" + body + "\u000D" + "\u000A"
            }
            data += "\u000D" + "\u000A"
            // Send data:
            sendAT("AT+CIPSEND=" + (data.length + 2), pauseBaseValue * 3)
            sendAT(data, pauseBaseValue * 6)
            // Close TCP connection:
            sendAT("AT+CIPCLOSE", pauseBaseValue * 3)
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
        recvString += serial.readString()

        if (currentCmd == ''){ //Cmd.ConnectWifi

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

        if(true){

            //recvString
        }
    });
}
