package main

import (
	"flag"
	"log"

	"github.com/virgo-galaxy/virgo-terminal/apps/local-client/internal/client"
)

// Local development can select a different page with --playground.
var playgroundURL = "https://terminal.virgogalaxy.com/"

func main() {
	playground := flag.String("playground", playgroundURL, "Playground URL")
	printURL := flag.Bool("print-url", false, "print the launch URL instead of opening a browser")
	flag.Parse()
	if err := client.Run(*playground, *printURL); err != nil {
		log.Fatal(err)
	}
}
