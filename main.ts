//% color=190 weight=100 icon="\uf1ec" block="vnw_microbit"
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

    basic.forever(function () {

    })
}

