"use client";
import { ReactElement } from "react";
import { useTheme } from "@/lib/theme/ThemeProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, CheckCircle2, AlertCircle } from "lucide-react";
export function ThemeDemo(): ReactElement {
  const { theme, actualTheme } = useTheme();
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Theme System Demo</CardTitle>
          <CardDescription>
            Current theme: <Badge variant="secondary">{theme}</Badge>
            {
              (theme = "system" && (
                <span className="ml-2">
                  (Resolved to: <Badge variant="outline">{actualTheme}</Badge>)
                </span>
              ))
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Color Palette */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Color Palette</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-background border border-border" />
                <p className="text-sm text-muted-foreground">Background</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-foreground" />
                <p className="text-sm text-muted-foreground">Foreground</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-primary" />
                <p className="text-sm text-muted-foreground">Primary</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-secondary" />
                <p className="text-sm text-muted-foreground">Secondary</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-muted" />
                <p className="text-sm text-muted-foreground">Muted</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-accent" />
                <p className="text-sm text-muted-foreground">Accent</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-destructive" />
                <p className="text-sm text-muted-foreground">Destructive</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 rounded-lg bg-card border border-border" />
                <p className="text-sm text-muted-foreground">Card</p>
              </div>
            </div>
          </div>
          {/* Components */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Components</h3>
            <div className="space-y-4">
              {/* Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
              {/* Input */}
              <div className="max-w-sm space-y-2">
                <Label htmlFor="demo-input">Input Example</Label>
                <Input id="demo-input" placeholder="Type something..." />
              </div>
              {/* Tabs */}
              <Tabs defaultValue="tab1" className="max-w-md">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                  <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                  <TabsTrigger value="tab3">Tab 3</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tab 1 Content</CardTitle>
                      <CardDescription>
                        This is the content for tab 1.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </TabsContent>
                <TabsContent value="tab2" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tab 2 Content</CardTitle>
                      <CardDescription>
                        This is the content for tab 2.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </TabsContent>
                <TabsContent value="tab3" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tab 3 Content</CardTitle>
                      <CardDescription>
                        This is the content for tab 3.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </TabsContent>
              </Tabs>
              {/* Alerts */}
              <div className="space-y-2">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Information</AlertTitle>
                  <AlertDescription>
                    This is an informational alert message.
                  </AlertDescription>
                </Alert>
                <Alert className="border-green-500/50 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>
                    This is a success alert message.
                  </AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    This is an error alert message.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
