package client

import (
	"bufio"
	"context"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/virgo-galaxy/virgo-terminal/apps/local-client/internal/connection"
	"github.com/virgo-galaxy/virgo-terminal/apps/local-client/internal/shell"
)

type desktopConfig struct {
	playgroundURL string
	shells        []shell.Option
	session       *connection.DesktopSession
	trust         *connection.BrowserTrust
}

func (d desktopConfig) connect(index int, remember bool) bool {
	return index >= 0 && index < len(d.shells) && d.session.Connect(d.shells[index], remember)
}

func (d desktopConfig) forgetBrowser() {
	if err := d.trust.Forget(); err != nil {
		log.Printf("Forget browser: %v", err)
	}
}

func runConsoleClient(config desktopConfig, stop context.CancelFunc, serve func() error) error {
	go func() {
		fmt.Printf("Playground: %s\n", config.playgroundURL)
		fmt.Println("Waiting to connect.")
		for i, option := range config.shells {
			fmt.Printf("  %d. %s\n", i+1, option.Name)
		}
		input := bufio.NewScanner(os.Stdin)
		for {
			fmt.Print("Shell [1], R to forget the browser, or Q to quit: ")
			if !input.Scan() {
				return
			}
			value := strings.ToLower(strings.TrimSpace(input.Text()))
			switch value {
			case "q":
				stop()
				return
			case "r":
				config.forgetBrowser()
				continue
			case "":
				value = "1"
			}
			index, err := strconv.Atoi(value)
			if err != nil || index < 1 || index > len(config.shells) {
				fmt.Println("Choose one of the listed Shells.")
				continue
			}
			fmt.Print("Remember this browser [Y/n] and connect: ")
			if !input.Scan() {
				return
			}
			choice := strings.ToLower(strings.TrimSpace(input.Text()))
			if choice == "q" {
				stop()
				return
			}
			if choice != "" && choice != "y" && choice != "n" {
				fmt.Println("Enter Y to remember the browser or N to connect once.")
				continue
			}
			remember := choice != "n"
			if config.connect(index-1, remember) {
				fmt.Println("Waiting to connect…")
			} else {
				fmt.Println("A connection is already in progress.")
			}
		}
	}()
	return serve()
}
