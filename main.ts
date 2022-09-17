namespace vnw_microbit{

    /**
     * Zobrazí háček
     */
    //% weight=1
    export function zobrazHacek(){

        basic.showLeds(`
            . . . . #
            . . . . #
            # # . # .
            . # # # .
            . . # . .
            `);
    }


}
basic.forever(function () {
	
})
