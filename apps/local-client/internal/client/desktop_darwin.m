//go:build cgo

#import <AppKit/AppKit.h>

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
- (void)openPlayground:(id)sender;
@end

@implementation VirgoClientWindowDelegate
- (void)dealloc {
    [_playgroundURL release];
    [super dealloc];
}

- (void)openPlayground:(id)sender {
    [NSWorkspace.sharedWorkspace openURL:self.playgroundURL];
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

void virgoRunClientWindow(const char *playgroundURL) {
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
        NSMenuItem *quitItem = [appMenu addItemWithTitle:quitTitle action:@selector(terminate:) keyEquivalent:@"q"];
        quitItem.target = app;
        appItem.submenu = appMenu;
        [mainMenu addItem:appItem];
        app.mainMenu = mainMenu;

        NSWindow *window = [[NSWindow alloc] initWithContentRect:NSMakeRect(0, 0, 360, 140)
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

        NSTextField *status = [NSTextField labelWithString:isChinese
            ? @"客户端已启动。"
            : @"Client is running."];
        NSString *linkTitle = isChinese ? @"打开 Playground" : @"Open Playground";
        NSButton *link = [NSButton buttonWithTitle:linkTitle target:delegate action:@selector(openPlayground:)];
        link.bordered = NO;
        link.attributedTitle = [[[NSAttributedString alloc] initWithString:linkTitle attributes:@{
            NSForegroundColorAttributeName: NSColor.linkColor,
            NSUnderlineStyleAttributeName: @(NSUnderlineStyleSingle),
        }] autorelease];
        NSButton *quit = [NSButton buttonWithTitle:quitTitle target:app action:@selector(terminate:)];
        windowTitle.translatesAutoresizingMaskIntoConstraints = NO;
        status.translatesAutoresizingMaskIntoConstraints = NO;
        link.translatesAutoresizingMaskIntoConstraints = NO;
        quit.translatesAutoresizingMaskIntoConstraints = NO;
        NSView *content = window.contentView;
        NSLayoutGuide *body = window.contentLayoutGuide;
        NSLayoutGuide *titlebar = [[[NSLayoutGuide alloc] init] autorelease];
        [content addLayoutGuide:titlebar];
        [content addSubview:windowTitle];
        [content addSubview:status];
        [content addSubview:link];
        [content addSubview:quit];
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
            [link.leadingAnchor constraintEqualToAnchor:content.leadingAnchor constant:24],
            [link.centerYAnchor constraintEqualToAnchor:quit.centerYAnchor],
            [quit.trailingAnchor constraintEqualToAnchor:content.trailingAnchor constant:-24],
            [quit.bottomAnchor constraintEqualToAnchor:content.bottomAnchor constant:-20],
        ]];

        [window center];
        [window makeKeyAndOrderFront:nil];
        if (@available(macOS 14.0, *)) {
            [app activate];
        }
        [app run];
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
