//go:build cgo

#import <AppKit/AppKit.h>
#include "_cgo_export.h"

enum { VirgoIdle, VirgoWaiting, VirgoConnecting, VirgoConnected };

static void stopApplication(void) {
    [NSApp stop:nil];
    [NSApp postEvent:[NSEvent otherEventWithType:NSEventTypeApplicationDefined
                                        location:NSZeroPoint
                                   modifierFlags:0
                                       timestamp:0
                                    windowNumber:0
                                         context:nil
                                         subtype:0
                                           data1:0
                                           data2:0]
             atStart:YES];
}

@interface VirgoClientWindowDelegate : NSObject <NSWindowDelegate, NSApplicationDelegate>
@property(nonatomic, retain) NSURL *playgroundURL;
@property(nonatomic, assign) NSPopUpButton *shellPicker;
@property(nonatomic, assign) NSButton *rememberBrowser;
- (void)openPlayground:(id)sender;
- (void)connect:(id)sender;
- (void)forgetBrowser:(id)sender;
@end

@implementation VirgoClientWindowDelegate
- (void)dealloc {
    [_playgroundURL release];
    [super dealloc];
}

- (void)openPlayground:(id)sender {
    [NSWorkspace.sharedWorkspace openURL:self.playgroundURL];
}

- (void)connect:(id)sender {
    virgoConnectShell((int)self.shellPicker.indexOfSelectedItem, self.rememberBrowser.state == NSControlStateValueOn);
}

- (void)forgetBrowser:(id)sender {
    virgoForgetBrowser();
}

- (BOOL)windowShouldClose:(NSWindow *)window {
    stopApplication();
    return YES;
}

- (NSApplicationTerminateReply)applicationShouldTerminate:(NSApplication *)application {
    stopApplication();
    return NSTerminateCancel;
}
@end

void virgoRunClientWindow(const char *playgroundURL, const char *shellNames) {
    @autoreleasepool {
        NSApplication *app = [NSApplication sharedApplication];
        [app setActivationPolicy:NSApplicationActivationPolicyRegular];
        VirgoClientWindowDelegate *delegate = [[VirgoClientWindowDelegate alloc] init];
        delegate.playgroundURL = [NSURL URLWithString:[NSString stringWithUTF8String:playgroundURL]];
        app.delegate = delegate;

        BOOL isChinese = [[NSLocale preferredLanguages].firstObject hasPrefix:@"zh"];
        NSString *quitTitle = isChinese ? @"退出客户端" : @"Quit Client";
        NSMenu *mainMenu = [[NSMenu alloc] init];
        NSMenu *appMenu = [[NSMenu alloc] init];
        NSMenuItem *appItem = [[NSMenuItem alloc] init];
        NSMenuItem *forgetItem = [appMenu addItemWithTitle:(isChinese ? @"清除已记住的浏览器" : @"Forget Remembered Browser")
                                                   action:@selector(forgetBrowser:) keyEquivalent:@""];
        forgetItem.target = delegate;
        [appMenu addItem:[NSMenuItem separatorItem]];
        NSMenuItem *quitItem = [appMenu addItemWithTitle:quitTitle action:@selector(terminate:) keyEquivalent:@"q"];
        quitItem.target = app;
        appItem.submenu = appMenu;
        [mainMenu addItem:appItem];
        app.mainMenu = mainMenu;

        NSWindow *window = [[NSWindow alloc] initWithContentRect:NSMakeRect(0, 0, 420, 215)
                                                      styleMask:NSWindowStyleMaskTitled | NSWindowStyleMaskClosable | NSWindowStyleMaskFullSizeContentView
                                                        backing:NSBackingStoreBuffered
                                                          defer:NO];
        window.releasedWhenClosed = NO;
        window.title = @"Virgo Terminal Client";
        window.titleVisibility = NSWindowTitleHidden;
        window.titlebarAppearsTransparent = YES;
        window.delegate = delegate;

        NSImageView *icon = [NSImageView imageViewWithImage:app.applicationIconImage];
        icon.imageScaling = NSImageScaleProportionallyUpOrDown;
        icon.accessibilityElement = NO;
        NSTextField *title = [NSTextField labelWithString:window.title];
        title.font = [NSFont titleBarFontOfSize:0];
        NSStackView *windowTitle = [NSStackView stackViewWithViews:@[icon, title]];
        windowTitle.alignment = NSLayoutAttributeCenterY;
        windowTitle.spacing = 6;

        NSArray<NSString *> *waitingStatuses = isChinese
            ? @[@"等待连接中", @"等待浏览器连接…", @"正在连接…", @"已连接"]
            : @[@"Waiting to connect", @"Waiting for the browser…", @"Connecting…", @"Connected"];
        NSTextField *status = [NSTextField labelWithString:waitingStatuses[VirgoIdle]];
        NSTextField *shellLabel = [NSTextField labelWithString:@"Shell"];
        NSPopUpButton *shellPicker = [[[NSPopUpButton alloc] initWithFrame:NSZeroRect pullsDown:NO] autorelease];
        [shellPicker addItemsWithTitles:[[NSString stringWithUTF8String:shellNames] componentsSeparatedByString:@"\n"]];
        NSMenuItem *systemShell = [shellPicker itemAtIndex:0];
        systemShell.title = [systemShell.title stringByAppendingString:(isChinese ? @"（系统默认）" : @" (System default)")];
        shellPicker.accessibilityLabel = shellLabel.stringValue;
        delegate.shellPicker = shellPicker;
        NSButton *rememberBrowser = [NSButton checkboxWithTitle:(isChinese ? @"记住此浏览器" : @"Remember this browser")
                                                        target:nil action:NULL];
        rememberBrowser.state = NSControlStateValueOn;
        delegate.rememberBrowser = rememberBrowser;
        NSString *linkTitle = isChinese ? @"打开 Playground" : @"Open Playground";
        NSButton *link = [NSButton buttonWithTitle:linkTitle target:delegate action:@selector(openPlayground:)];
        link.bordered = NO;
        link.attributedTitle = [[[NSAttributedString alloc] initWithString:linkTitle attributes:@{
            NSForegroundColorAttributeName: NSColor.linkColor,
            NSUnderlineStyleAttributeName: @(NSUnderlineStyleSingle),
        }] autorelease];
        NSButton *quit = [NSButton buttonWithTitle:quitTitle target:app action:@selector(terminate:)];
        NSButton *connect = [NSButton buttonWithTitle:(isChinese ? @"连接" : @"Connect") target:delegate action:@selector(connect:)];
        window.defaultButtonCell = connect.cell;
        NSView *content = window.contentView;
        NSLayoutGuide *body = window.contentLayoutGuide;
        NSLayoutGuide *titlebar = [[[NSLayoutGuide alloc] init] autorelease];
        [content addLayoutGuide:titlebar];
        for (NSView *view in @[windowTitle, status, shellLabel, shellPicker, rememberBrowser, link, quit, connect]) {
            view.translatesAutoresizingMaskIntoConstraints = NO;
            [content addSubview:view];
        }
        [NSLayoutConstraint activateConstraints:@[
            [titlebar.topAnchor constraintEqualToAnchor:content.topAnchor],
            [titlebar.bottomAnchor constraintEqualToAnchor:body.topAnchor],
            [titlebar.leadingAnchor constraintEqualToAnchor:content.leadingAnchor],
            [titlebar.trailingAnchor constraintEqualToAnchor:content.trailingAnchor],
            [windowTitle.centerXAnchor constraintEqualToAnchor:titlebar.centerXAnchor],
            [windowTitle.centerYAnchor constraintEqualToAnchor:titlebar.centerYAnchor],
            [icon.widthAnchor constraintEqualToConstant:16],
            [icon.heightAnchor constraintEqualToConstant:16],
            [status.topAnchor constraintEqualToAnchor:body.topAnchor constant:24],
            [status.leadingAnchor constraintEqualToAnchor:content.leadingAnchor constant:24],
            [status.trailingAnchor constraintLessThanOrEqualToAnchor:content.trailingAnchor constant:-24],
            [shellPicker.topAnchor constraintEqualToAnchor:status.bottomAnchor constant:16],
            [shellPicker.leadingAnchor constraintEqualToAnchor:content.leadingAnchor constant:88],
            [shellPicker.trailingAnchor constraintEqualToAnchor:content.trailingAnchor constant:-24],
            [shellLabel.leadingAnchor constraintEqualToAnchor:status.leadingAnchor],
            [shellLabel.centerYAnchor constraintEqualToAnchor:shellPicker.centerYAnchor],
            [rememberBrowser.topAnchor constraintEqualToAnchor:shellPicker.bottomAnchor constant:12],
            [rememberBrowser.leadingAnchor constraintEqualToAnchor:status.leadingAnchor],
            [link.leadingAnchor constraintEqualToAnchor:content.leadingAnchor constant:24],
            [link.centerYAnchor constraintEqualToAnchor:quit.centerYAnchor],
            [link.trailingAnchor constraintLessThanOrEqualToAnchor:quit.leadingAnchor constant:-16],
            [connect.trailingAnchor constraintEqualToAnchor:content.trailingAnchor constant:-24],
            [connect.centerYAnchor constraintEqualToAnchor:quit.centerYAnchor],
            [quit.trailingAnchor constraintEqualToAnchor:connect.leadingAnchor constant:-8],
            [quit.bottomAnchor constraintEqualToAnchor:content.bottomAnchor constant:-20],
        ]];

        NSTimer *statusTimer = [NSTimer scheduledTimerWithTimeInterval:0.2 repeats:YES block:^(NSTimer *timer) {
            int state = virgoConnectionState();
            status.stringValue = waitingStatuses[state];
            BOOL idle = state == VirgoIdle;
            connect.enabled = idle;
            shellPicker.enabled = idle;
            rememberBrowser.enabled = idle;
        }];
        [window center];
        [window makeKeyAndOrderFront:nil];
        if (@available(macOS 14.0, *)) {
            [app activate];
        }
        [app run];
        [statusTimer invalidate];
        [window orderOut:nil];
        window.delegate = nil;
        app.delegate = nil;
        [window release];
        [appItem release];
        [appMenu release];
        [mainMenu release];
        [delegate release];
    }
}

void virgoStopClientWindow(void) {
    dispatch_async(dispatch_get_main_queue(), ^{
        stopApplication();
    });
}
